"use client";

import { useState, useEffect, useCallback } from "react";

export default function PageCodes() {
  const [spins, setSpins] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [validating, setValidating] = useState(null);
  const [quickCode, setQuickCode] = useState("");
  const [quickResult, setQuickResult] = useState(null);
  const [quickLoading, setQuickLoading] = useState(false);

  const fetchSpins = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    const r = await fetch(`/api/user/validations?${params}`);
    const d = await r.json();
    setSpins(d.spins || []);
    setTotal(d.total || 0);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchSpins(); }, [fetchSpins]);

  const handleQuickValidate = async () => {
    if (!quickCode.trim()) return;
    setQuickLoading(true);
    setQuickResult(null);
    const r = await fetch("/api/user/validations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winCode: quickCode.trim() }),
    });
    const d = await r.json();
    setQuickResult({ ok: r.ok, ...d });
    setQuickLoading(false);
    if (r.ok) { setQuickCode(""); fetchSpins(); }
  };

  const handleValidate = async (winCode) => {
    setValidating(winCode);
    const r = await fetch("/api/user/validations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winCode }),
    });
    const d = await r.json();
    if (r.ok) fetchSpins();
    else alert(d.error || "Erreur");
    setValidating(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-[28px] font-extrabold text-dark-900 tracking-tight">
          Validations
        </h1>
        <p className="text-gray-400 text-sm mt-1.5">
          Vérifiez et validez les codes gagnants de vos clients
        </p>
      </div>

      {/* ── Validation rapide ── */}
      <div className="card p-6 mb-6">
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px", color: "#0F0F1A" }}>
          Valider un code en caisse
        </h3>
        <p style={{ fontSize: 13, color: "#718096", margin: "0 0 16px" }}>
          Le client vous présente son code — entrez-le ici pour le valider et lui remettre son cadeau.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={quickCode}
            onChange={e => { setQuickCode(e.target.value.toUpperCase()); setQuickResult(null); }}
            onKeyDown={e => e.key === "Enter" && handleQuickValidate()}
            placeholder="WIN-XXXX-XXXX"
            maxLength={12}
            style={{
              flex: "1 1 220px", padding: "13px 18px", borderRadius: 12,
              border: "2px solid #E2E8F0", fontSize: 20, fontWeight: 800,
              letterSpacing: 4, fontFamily: "'JetBrains Mono', monospace",
              outline: "none", transition: "border-color 0.2s", background: "#fff",
              boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = "#6C5CE7"}
            onBlur={e => e.target.style.borderColor = "#E2E8F0"}
          />
          <button
            onClick={handleQuickValidate}
            disabled={quickLoading || !quickCode.trim()}
            style={{
              padding: "13px 28px", borderRadius: 12, border: "none",
              background: quickLoading || !quickCode.trim()
                ? "#b2bec3"
                : "linear-gradient(135deg, #6C5CE7, #00B894)",
              color: "#fff", fontWeight: 800, fontSize: 15,
              cursor: quickLoading || !quickCode.trim() ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
            }}
          >
            {quickLoading ? "Vérification…" : "Valider"}
          </button>
        </div>

        {quickResult && (
          <div style={{
            marginTop: 14, padding: "14px 18px", borderRadius: 12,
            background: quickResult.ok ? "#F0FFF4" : "#FFF5F5",
            border: `1.5px solid ${quickResult.ok ? "#9AE6B4" : "#FEB2B2"}`,
          }}>
            {quickResult.ok ? (
              <div>
                <p style={{ fontWeight: 800, color: "#276749", fontSize: 15, margin: "0 0 4px" }}>
                  ✓ Code valide ! Remettez le cadeau au client.
                </p>
                <p style={{ color: "#2F855A", fontSize: 13, margin: 0 }}>
                  Récompense : <strong>{quickResult.rewardName}</strong> — {quickResult.entreprise}
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 700, color: "#C53030", fontSize: 14, margin: "0 0 4px" }}>
                  ✗ {quickResult.error}
                </p>
                {quickResult.validatedAt && (
                  <p style={{ fontSize: 12, color: "#E53E3E", margin: 0 }}>
                    Code déjà utilisé le {new Date(quickResult.validatedAt).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value.toUpperCase())}
          placeholder="Rechercher WIN-XXXX-XXXX…"
          style={{
            flex: "1 1 200px", padding: "10px 16px", borderRadius: 12,
            border: "1.5px solid #E2E8F0", fontSize: 14, outline: "none",
            fontFamily: "'JetBrains Mono', monospace", background: "#fff",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#6C5CE7"}
          onBlur={e => e.target.style.borderColor = "#E2E8F0"}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: "10px 16px", borderRadius: 12, border: "1.5px solid #E2E8F0",
            fontSize: 14, outline: "none", background: "#fff", cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <option value="">Tous les codes</option>
          <option value="pending">En attente</option>
          <option value="validated">Validés</option>
        </select>
      </div>

      {/* ── Liste ── */}
      <div className="card overflow-hidden">
        <div style={{
          display: "grid", gridTemplateColumns: "1.5fr 2fr 1.2fr 1fr 110px",
          padding: "12px 24px", background: "#FAFAFA",
          borderBottom: "1.5px solid #F0F0F5",
          fontSize: 11, fontWeight: 800, color: "#b2bec3",
          textTransform: "uppercase", letterSpacing: 1,
        }}>
          <div>Code</div>
          <div>Cadeau gagné</div>
          <div>Établissement</div>
          <div>Date</div>
          <div style={{ textAlign: "center" }}>Statut</div>
        </div>

        {loading && (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "#b2bec3", fontSize: 14 }}>
            Chargement…
          </div>
        )}

        {!loading && spins.length === 0 && (
          <div style={{ padding: "52px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎰</div>
            <p style={{ fontWeight: 700, color: "#8b8da0", marginBottom: 6 }}>
              Aucun code {statusFilter === "pending" ? "en attente" : statusFilter === "validated" ? "validé" : "généré"} pour l&apos;instant
            </p>
            <p style={{ color: "#b2bec3", fontSize: 13 }}>
              Les codes apparaissent ici dès qu&apos;un client tourne la roue.
            </p>
          </div>
        )}

        {spins.map((spin) => (
          <div
            key={spin._id}
            style={{
              display: "grid", gridTemplateColumns: "1.5fr 2fr 1.2fr 1fr 110px",
              padding: "13px 24px", borderBottom: "1px solid #F8F8FC",
              alignItems: "center", fontSize: 13,
              background: spin.validated ? "#FAFFFE" : "#fff",
              transition: "background 0.15s",
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700, fontSize: 13, color: "#0F0F1A", letterSpacing: 1,
            }}>
              {spin.winCode}
            </div>

            <div style={{ fontWeight: 600, color: "#2d3436" }}>
              {spin.rewardName}
            </div>

            <div style={{ color: "#718096", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {spin.entrepriseId?.nom || "—"}
            </div>

            <div style={{ color: "#8b8da0", fontSize: 12 }}>
              {new Date(spin.createdAt).toLocaleDateString("fr-FR")}
              <br />
              <span style={{ fontSize: 11 }}>
                {new Date(spin.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div style={{ textAlign: "center" }}>
              {spin.validated ? (
                <span style={{
                  padding: "5px 12px", borderRadius: 8,
                  background: "#00B89415", color: "#00B894",
                  fontWeight: 700, fontSize: 12,
                }}>
                  ✓ Validé
                </span>
              ) : (
                <button
                  onClick={() => handleValidate(spin.winCode)}
                  disabled={validating === spin.winCode}
                  style={{
                    padding: "6px 14px", borderRadius: 9, border: "none",
                    background: validating === spin.winCode ? "#b2bec3" : "#6C5CE7",
                    color: "#fff", fontWeight: 700, fontSize: 12,
                    cursor: validating === spin.winCode ? "not-allowed" : "pointer",
                    fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
                  }}
                >
                  {validating === spin.winCode ? "…" : "Valider"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <p style={{ fontSize: 13, color: "#b2bec3", textAlign: "right", marginTop: 10 }}>
          {total} code{total > 1 ? "s" : ""} au total
        </p>
      )}
    </div>
  );
}
