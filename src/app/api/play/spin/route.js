import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Entreprise from "@/lib/models/Entreprise";
import Spin from "@/lib/models/Spin";

// Génère un code gagnant unique format WIN-XXXX-XXXX
function generateWinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `WIN-${rand(4)}-${rand(4)}`;
}

// POST /api/play/spin
// Appelé par le client final après que la roue a tourné côté client
// body: { slug, rewardName, rewardIndex }
// Retourne: { winCode, rewardName }
export async function POST(req) {
  try {
    const { slug, rewardName, rewardIndex } = await req.json();

    if (!slug || !rewardName) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    await connectDB();

    const entreprise = await Entreprise.findOne({ slug: slug.toLowerCase(), active: true });
    if (!entreprise) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
    }

    // Générer un code unique (retry si collision)
    let winCode, tries = 0;
    do {
      winCode = generateWinCode();
      tries++;
    } while (tries < 10 && (await Spin.exists({ winCode })));

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    const spin = await Spin.create({
      entrepriseId: entreprise._id,
      winCode,
      rewardName,
      rewardIndex: rewardIndex ?? 0,
      ip: ip.split(",")[0].trim(),
    });

    // Incrémenter le compteur de scans
    await Entreprise.updateOne({ _id: entreprise._id }, { $inc: { totalScans: 1 } });

    return NextResponse.json({ winCode: spin.winCode, rewardName: spin.rewardName });
  } catch (err) {
    console.error("Spin error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
