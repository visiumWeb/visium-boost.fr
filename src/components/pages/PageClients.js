"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

// Si domaine custom configuré → sous-domaine (restaurant.zreview.fr)
// Sinon → chemin direct (zreview.vercel.app/s/restaurant)
const CUSTOM_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function getPublicUrl(slug) {
  if (CUSTOM_DOMAIN) {
    return `https://${slug}.${CUSTOM_DOMAIN}`;
  }
  // Fallback : chemin direct sur l'URL de déploiement
  const base = APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/s/${slug}`;
}

const emptyForm = {
  nom: "", slug: "", lien_avis: "",
  couleur_principale: "#6C5CE7", couleur_secondaire: "#00B894",
  cta_text: "Laissez-nous un avis et tentez votre chance !",
};

export default function PageClients() {
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  const fetchEntreprises = async () => {
    const r = await fetch("/api/entreprises");
    const d = await r.json();
    setEntreprises(d.entreprises || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntreprises(); }, []);

  const slugify = (str) =>
    str.toLowerCase().trim()
      .replace(/[àâä]/g, "a").replace(/[éèêë]/g, "e").replace(/[ïî]/g, "i")
      .replace(/[ôö]/g, "o").replace(/[ùûü]/g, "u").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleNomChange = (nom) => {
    setForm(p => ({
      ...p, nom,
      slug: p.slug || slugify(nom),
    }));
  };

  const handleSave = async () => {
    setError(""); setSaving(true);
    const r = await fetch("/api/entreprises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Erreur"); setSaving(false); return; }
    await fetchEntreprises();
    setForm(emptyForm); setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette entreprise ?")) return;
    await fetch("/api/entreprises", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchEntreprises();
  };

  const copyUrl = (slug) => {
    navigator.clipboard.writeText(getPublicUrl(slug));
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
    fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-dark-900 tracking-tight">
            Mes entreprises
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            {entreprises.length} établissement{entreprises.length > 1 ? "s" : ""} —
            {" "}chaque entreprise a sa propre URL{" "}
            <code style={{ fontSize: 11, background: "#F0F0FA", padding: "2px 6px", borderRadius: 4 }}>
              {CUSTOM_DOMAIN ? `slug.${CUSTOM_DOMAIN}` : `${APP_URL}/s/slug`}
            </code>
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Icon name="plus" size={18} color="#fff" />
          Ajouter une entreprise
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, color: "#0F0F1A" }}>
            Nouvelle entreprise
          </h3>

          {error && (
            <div style={{
              background: "#FFF5F5", border: "1.5px solid #FED7D7", borderRadius: 10,
              padding: "10px 14px", fontSize: 13, color: "#E53E3E", fontWeight: 600,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>
                Nom de l&apos;entreprise *
              </label>
              <input
                value={form.nom}
                onChange={e => handleNomChange(e.target.value)}
                placeholder="Restaurant Le Gourmet"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#6C5CE7"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>
                Slug URL * —{" "}
                <span style={{ color: "#6C5CE7" }}>
                  {form.slug
                    ? getPublicUrl(form.slug)
                    : (CUSTOM_DOMAIN ? `….${CUSTOM_DOMAIN}` : `${APP_URL}/s/…`)}
                </span>
              </label>
              <input
                value={form.slug}
                onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                placeholder="restaurant-le-gourmet"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#6C5CE7"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <p style={{ fontSize: 11, color: "#b2bec3", marginTop: 4 }}>
                Uniquement lettres minuscules, chiffres et tirets
              </p>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>
                Lien avis Google
              </label>
              <input
                value={form.lien_avis}
                onChange={e => setForm(p => ({ ...p, lien_avis: e.target.value }))}
                placeholder="https://g.page/r/..."
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#6C5CE7"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>
                Message CTA
              </label>
              <input
                value={form.cta_text}
                onChange={e => setForm(p => ({ ...p, cta_text: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#6C5CE7"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>
                  Couleur principale
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.couleur_principale}
                    onChange={e => setForm(p => ({ ...p, couleur_principale: e.target.value }))}
                    style={{ width: 42, height: 36, borderRadius: 8, border: "1.5px solid #e2e8f0", cursor: "pointer", padding: 2 }}
                  />
                  <input
                    value={form.couleur_principale}
                    onChange={e => setForm(p => ({ ...p, couleur_principale: e.target.value }))}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = "#6C5CE7"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>
                  Couleur secondaire
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.couleur_secondaire}
                    onChange={e => setForm(p => ({ ...p, couleur_secondaire: e.target.value }))}
                    style={{ width: 42, height: 36, borderRadius: 8, border: "1.5px solid #e2e8f0", cursor: "pointer", padding: 2 }}
                  />
                  <input
                    value={form.couleur_secondaire}
                    onChange={e => setForm(p => ({ ...p, couleur_secondaire: e.target.value }))}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = "#6C5CE7"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={handleSave}
              disabled={saving || !form.nom || !form.slug}
              style={{
                padding: "11px 28px", borderRadius: 10, border: "none",
                background: saving || !form.nom || !form.slug ? "#b2bec3" : "linear-gradient(135deg, #6C5CE7, #00B894)",
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: saving || !form.nom || !form.slug ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {saving ? "Enregistrement…" : "Créer l'entreprise"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm); setError(""); }}
              style={{
                padding: "11px 20px", borderRadius: 10,
                border: "1.5px solid #e2e8f0", background: "#fff",
                color: "#636e72", fontWeight: 600, fontSize: 14,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Entreprises list */}
      {loading ? (
        <div className="card p-10 text-center text-gray-300 text-sm">Chargement…</div>
      ) : entreprises.length === 0 ? (
        <div className="card p-12 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
          <p style={{ color: "#8b8da0", fontWeight: 600, marginBottom: 8 }}>Aucune entreprise configurée</p>
          <p style={{ color: "#b2bec3", fontSize: 13 }}>Ajoutez votre premier établissement pour commencer.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 120px",
            padding: "12px 24px", borderBottom: "1.5px solid #F0F0F5",
            fontSize: 11, fontWeight: 800, color: "#b2bec3", textTransform: "uppercase", letterSpacing: 1,
            background: "#FAFAFA",
          }}>
            <div>Entreprise</div>
            <div>URL publique</div>
            <div>Scans</div>
            <div>Avis</div>
            <div />
          </div>

          {entreprises.map((e) => {
            const pubUrl = getPublicUrl(e.slug);
            return (
              <div key={e._id} style={{
                display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 120px",
                padding: "14px 24px", borderBottom: "1px solid #F8F8FC",
                alignItems: "center", fontSize: 13, transition: "background 0.15s",
              }}
                onMouseEnter={e2 => e2.currentTarget.style.background = "#FAFAFE"}
                onMouseLeave={e2 => e2.currentTarget.style.background = "#fff"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${e.couleur_principale}, ${e.couleur_secondaire})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                      {e.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0F0F1A" }}>{e.nom}</div>
                    <div style={{ fontSize: 11, color: "#b2bec3" }}>
                      Créé le {new Date(e.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a
                    href={pubUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#6C5CE7", fontWeight: 600, fontSize: 12, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {pubUrl}
                  </a>
                  <button
                    onClick={() => copyUrl(e.slug)}
                    style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                      border: "1.5px solid #e2e8f0", background: "#fff",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, transition: "all 0.2s",
                    }}
                    title="Copier l'URL"
                  >
                    {copied === e.slug ? "✓" : "⧉"}
                  </button>
                </div>

                <div style={{ color: "#636e72", fontWeight: 600 }}>{e.totalScans || 0}</div>
                <div style={{ color: "#636e72", fontWeight: 600 }}>{e.totalReviews || 0}</div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <a
                    href={pubUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: "6px 12px", borderRadius: 8,
                      background: "#F0F0FA", color: "#6C5CE7",
                      fontWeight: 700, fontSize: 12, textDecoration: "none",
                    }}
                  >
                    Voir
                  </a>
                  <button
                    onClick={() => handleDelete(e._id)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: "none",
                      background: "#FFF5F5", color: "#E53E3E", cursor: "pointer", fontSize: 14,
                    }}
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
