import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Entreprise from "@/lib/models/Entreprise";
import Spin from "@/lib/models/Spin";

export async function GET() {
  const session = getCurrentUser();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await connectDB();

  const entreprises = await Entreprise.find({ userId: session.id }).lean();
  const ids = entreprises.map((e) => e._id);

  const [totalSpins, validatedSpins, recentSpins] = await Promise.all([
    Spin.countDocuments({ entrepriseId: { $in: ids } }),
    Spin.countDocuments({ entrepriseId: { $in: ids }, validated: true }),
    // Spins des 7 derniers jours par jour
    Spin.aggregate([
      {
        $match: {
          entrepriseId: { $in: ids },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalScans = entreprises.reduce((s, e) => s + (e.totalScans || 0), 0);
  const conversionRate = totalSpins > 0 ? Math.round((validatedSpins / totalSpins) * 100) : 0;

  // Remplir les 7 derniers jours
  const weekChart = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("fr-FR", { weekday: "short" });
    const found = recentSpins.find((r) => r._id === key);
    weekChart.push({ label, count: found ? found.count : 0 });
  }

  return NextResponse.json({
    totalScans,
    totalSpins,
    validatedSpins,
    pendingSpins: totalSpins - validatedSpins,
    conversionRate,
    totalEntreprises: entreprises.length,
    weekChart,
  });
}
