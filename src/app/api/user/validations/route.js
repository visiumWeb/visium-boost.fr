import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Spin from "@/lib/models/Spin";
import Entreprise from "@/lib/models/Entreprise";

// Récupère tous les IDs des entreprises de l'utilisateur connecté
async function getUserEntrepriseIds(userId) {
  const entreprises = await Entreprise.find({ userId }).select("_id").lean();
  return entreprises.map((e) => e._id);
}

// GET /api/user/validations?q=WIN-XXX&status=pending&entrepriseId=xxx
export async function GET(req) {
  const session = getCurrentUser();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || ""; // "pending" | "validated" | ""
  const entrepriseId = searchParams.get("entrepriseId") || "";

  const entrepriseIds = await getUserEntrepriseIds(session.id);
  if (entrepriseIds.length === 0) return NextResponse.json({ spins: [], total: 0 });

  const filter = { entrepriseId: { $in: entrepriseIds } };
  if (q) filter.winCode = { $regex: q.toUpperCase(), $options: "i" };
  if (status === "pending") filter.validated = false;
  if (status === "validated") filter.validated = true;
  if (entrepriseId) filter.entrepriseId = entrepriseId;

  const spins = await Spin.find(filter)
    .populate("entrepriseId", "nom slug")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const total = await Spin.countDocuments(filter);

  return NextResponse.json({ spins, total });
}

// POST /api/user/validations — valider un code en physique
// body: { winCode }
export async function POST(req) {
  const session = getCurrentUser();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { winCode } = await req.json();
  if (!winCode) return NextResponse.json({ error: "Code manquant" }, { status: 400 });

  await connectDB();

  const entrepriseIds = await getUserEntrepriseIds(session.id);

  const spin = await Spin.findOne({
    winCode: winCode.toUpperCase().trim(),
    entrepriseId: { $in: entrepriseIds },
  }).populate("entrepriseId", "nom");

  if (!spin) {
    return NextResponse.json({ error: "Code introuvable ou n'appartient pas à vos entreprises" }, { status: 404 });
  }
  if (spin.validated) {
    return NextResponse.json({
      error: "Code déjà validé",
      validatedAt: spin.validatedAt,
      rewardName: spin.rewardName,
    }, { status: 409 });
  }

  await Spin.updateOne({ _id: spin._id }, { validated: true, validatedAt: new Date() });
  await Entreprise.updateOne({ _id: spin.entrepriseId._id }, { $inc: { totalReviews: 1 } });

  return NextResponse.json({
    success: true,
    winCode: spin.winCode,
    rewardName: spin.rewardName,
    entreprise: spin.entrepriseId.nom,
  });
}
