"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export default function PageDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const s = stats || {};
  const weekChart = s.weekChart || Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { label: d.toLocaleDateString("fr-FR", { weekday: "short" }), count: 0 };
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-dark-900 tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* Stats grid */}
      <div className="flex flex-wrap gap-4 mb-7">
        <StatCard
          icon="qr"
          label="Scans de page"
          value={loading ? "…" : String(s.totalScans ?? 0)}
          color="#6C5CE7"
        />
        <StatCard
          icon="wheel"
          label="Roues tournées"
          value={loading ? "…" : String(s.totalSpins ?? 0)}
          color="#0984E3"
        />
        <StatCard
          icon="check"
          label="Codes validés"
          value={loading ? "…" : String(s.validatedSpins ?? 0)}
          color="#00B894"
        />
        <StatCard
          icon="trendUp"
          label="Taux de retrait"
          value={loading ? "…" : `${s.conversionRate ?? 0}%`}
          color="#E17055"
        />
      </div>

      {!loading && s.totalSpins === 0 && (
        <div style={{
          background: "linear-gradient(135deg, #6C5CE715, #00B89410)",
          border: "1.5px solid #6C5CE730",
          borderRadius: 16, padding: "20px 24px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>🚀</span>
          <div>
            <p style={{ fontWeight: 800, color: "#0F0F1A", margin: "0 0 4px", fontSize: 15 }}>
              Aucune activité pour l&apos;instant
            </p>
            <p style={{ color: "#636e72", fontSize: 13, margin: 0 }}>
              Configurez votre roue dans &quot;Mes entreprises&quot; et partagez votre lien avec vos clients !
            </p>
          </div>
        </div>
      )}

      {/* Codes en attente */}
      {!loading && s.pendingSpins > 0 && (
        <div style={{
          background: "#FFFBEB", border: "1.5px solid #F6C90080",
          borderRadius: 16, padding: "16px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>⏳</span>
          <p style={{ fontWeight: 700, color: "#92400E", fontSize: 14, margin: 0 }}>
            <strong>{s.pendingSpins}</strong> code{s.pendingSpins > 1 ? "s" : ""} en attente de validation —{" "}
            rendez-vous dans l&apos;onglet &quot;Validations&quot; pour les vérifier.
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="card p-7">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 className="text-base font-bold text-dark-900">
            Roues tournées — 7 derniers jours
          </h3>
          <span style={{
            fontSize: 12, fontWeight: 700, color: "#6C5CE7",
            background: "#6C5CE715", padding: "4px 10px", borderRadius: 8,
          }}>
            Total : {s.totalSpins ?? 0}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={weekChart}>
            <defs>
              <linearGradient id="gSpins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false}
              style={{ fontSize: 12, fill: "#8b8da0" }} />
            <YAxis axisLine={false} tickLine={false}
              style={{ fontSize: 11, fill: "#8b8da0" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f5", fontSize: 13, fontFamily: "'Inter', sans-serif" }}
              formatter={(v) => [v, "Roues tournées"]}
            />
            <Area type="monotone" dataKey="count" stroke="#6C5CE7"
              strokeWidth={2.5} fill="url(#gSpins)" name="Roues" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
