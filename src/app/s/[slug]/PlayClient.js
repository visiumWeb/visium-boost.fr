"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Wheel Canvas ───────────────────────────────────────────────────────
function SpinWheel({ rewards, primaryColor, secondaryColor, onResult, disabled }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const angleRef = useRef(0);

  const COLORS = [primaryColor, secondaryColor, "#FDCB6E", "#E17055", "#0984E3", "#FD79A8", "#74B9FF", "#55EFC4"];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, cx = W / 2, R = cx - 14;
    ctx.clearRect(0, 0, W, W);

    // Shadow ring
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.arc(cx, cx, R + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.restore();

    const n = rewards.length;
    const arc = (Math.PI * 2) / n;
    rewards.forEach((rw, i) => {
      const a0 = angleRef.current + i * arc;
      ctx.beginPath(); ctx.moveTo(cx, cx); ctx.arc(cx, cx, R, a0, a0 + arc); ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.save(); ctx.translate(cx, cx); ctx.rotate(a0 + arc / 2);
      ctx.textAlign = "right"; ctx.fillStyle = "#fff";
      ctx.font = `bold 13px 'Inter', sans-serif`;
      const label = rw.name.length > 14 ? rw.name.slice(0, 14) + "…" : rw.name;
      ctx.fillText(label, R - 16, 5);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath(); ctx.arc(cx, cx, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = primaryColor; ctx.lineWidth = 3; ctx.stroke();

    // Arrow pointer (right side)
    ctx.save(); ctx.translate(cx + R + 2, cx);
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-6, -12); ctx.lineTo(-6, 12); ctx.closePath();
    ctx.fillStyle = "#E17055"; ctx.fill(); ctx.restore();

    // Overlay gris si désactivé
    if (disabled && !spinning) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(cx, cx, R + 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }, [rewards, primaryColor, secondaryColor, disabled, spinning]);

  useEffect(() => { draw(); }, [draw]);

  const spin = () => {
    if (spinning || done || disabled || rewards.length === 0) return;
    setSpinning(true);

    // Weighted random selection
    const rand = Math.random() * 100;
    let acc = 0, winIdx = 0;
    for (let i = 0; i < rewards.length; i++) {
      acc += rewards[i].probability;
      if (rand <= acc) { winIdx = i; break; }
    }

    const arc = (Math.PI * 2) / rewards.length;
    const target = -(winIdx * arc + arc / 2);
    const spins = 6 + Math.random() * 4;
    const total = Math.PI * 2 * spins + (target - (angleRef.current % (Math.PI * 2)));
    const dur = 5000, start = Date.now(), startA = angleRef.current;

    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const anim = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      angleRef.current = startA + total * ease(t);
      draw();
      if (t < 1) requestAnimationFrame(anim);
      else {
        setSpinning(false);
        setDone(true);
        onResult?.(rewards[winIdx], winIdx);
      }
    };
    requestAnimationFrame(anim);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        style={{
          maxWidth: "100%",
          cursor: disabled || done ? "default" : (spinning ? "wait" : "pointer"),
          opacity: disabled && !spinning ? 0.6 : 1,
          transition: "opacity 0.3s",
        }}
        onClick={spin}
      />
      {!done && (
        <button
          onClick={spin}
          disabled={spinning || disabled}
          style={{
            padding: "16px 40px", borderRadius: 14, border: "none",
            cursor: spinning || disabled ? "not-allowed" : "pointer",
            background: disabled ? "#b2bec3" : spinning ? "#b2bec3" : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: "#fff", fontWeight: 800, fontSize: 17,
            fontFamily: "'Inter', sans-serif",
            boxShadow: disabled || spinning ? "none" : `0 6px 28px ${primaryColor}55`,
            transition: "all 0.2s",
          }}
        >
          {spinning ? "La roue tourne…" : disabled ? "Laissez d'abord un avis →" : "🎡 Tourner la roue !"}
        </button>
      )}
    </div>
  );
}

// ─── Confetti ──────────────────────────────────────────────────────────
function Confetti({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = window.innerWidth; c.height = window.innerHeight;
    const cols = ["#6C5CE7","#00B894","#FDCB6E","#E17055","#0984E3","#FD79A8"];
    const ps = Array.from({ length: 140 }, () => ({
      x: Math.random() * c.width, y: -20,
      w: Math.random() * 10 + 5, h: Math.random() * 6 + 3,
      color: cols[Math.floor(Math.random() * cols.length)],
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 4 + 2,
      rot: Math.random() * 360, vr: (Math.random() - 0.5) * 8,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      let alive = false;
      ps.forEach(p => {
        if (p.y < c.height + 20) alive = true;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.06;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }} />;
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function PlayClient({ entreprise }) {
  // step 1 = accueil + bouton avis
  // step 2 = roue (débloquée après avoir cliqué avis)
  // step 3 = résultat + code gagnant
  const [step, setStep] = useState(1);
  const [reviewClicked, setReviewClicked] = useState(false);
  const [result, setResult] = useState(null);   // { rewardName, rewardIndex }
  const [winCode, setWinCode] = useState(null); // code généré après la roue
  const [generating, setGenerating] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [copied, setCopied] = useState(false);

  const pc = entreprise.couleur_principale;
  const sc = entreprise.couleur_secondaire;

  const handleReviewClick = () => {
    setReviewClicked(true);
    // Ouvre le lien Google dans un nouvel onglet
    if (entreprise.lien_avis) {
      window.open(entreprise.lien_avis, "_blank", "noopener,noreferrer");
    }
  };

  const handleSpinResult = async (reward, rewardIndex) => {
    setResult({ rewardName: reward.name, rewardIndex });
    setGenerating(true);

    try {
      const res = await fetch("/api/play/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: entreprise.slug,
          rewardName: reward.name,
          rewardIndex,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWinCode(data.winCode);
        setStep(3);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 5500);
      } else {
        setWinCode("ERREUR");
        setStep(3);
      }
    } catch {
      setWinCode("ERREUR");
      setStep(3);
    }
    setGenerating(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(winCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: `linear-gradient(160deg, ${pc}10 0%, ${sc}08 50%, #F8FAFC 100%)`,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <Confetti active={confetti} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px);} to { opacity:1; transform:translateY(0);} }
        @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {entreprise.logo ? (
          <img src={entreprise.logo} alt={entreprise.nom}
            style={{ height: 36, borderRadius: 8, objectFit: "contain" }} />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: `linear-gradient(135deg, ${pc}, ${sc})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>
              {entreprise.nom.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span style={{ fontWeight: 800, fontSize: 18, color: "#0F0F1A" }}>{entreprise.nom}</span>
      </header>

      <main style={{ maxWidth: 460, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* ── STEP 1 & 2 : Roue (visible tout le temps) ── */}
        {step !== 3 && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            {/* Indicateur étapes */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
              {[
                { n: 1, label: "Avis Google" },
                { n: 2, label: "Roue" },
                { n: 3, label: "Cadeau" },
              ].map(({ n, label }) => {
                const active = step === n || (n === 2 && reviewClicked);
                const done = (n === 1 && reviewClicked) || (n < step);
                return (
                  <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: done ? "#00B894" : active ? pc : "#E2E8F0",
                      color: done || active ? "#fff" : "#b2bec3",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, transition: "all 0.3s",
                    }}>
                      {done ? "✓" : n}
                    </div>
                    <span style={{ fontSize: 11, color: active ? pc : "#b2bec3", fontWeight: 600 }}>{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Message contextuel */}
            {!reviewClicked ? (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>⭐</div>
                <h1 style={{
                  fontSize: 24, fontWeight: 900, color: "#0F0F1A",
                  margin: "0 0 10px", lineHeight: 1.3,
                }}>
                  {entreprise.cta_text}
                </h1>
                <p style={{ color: "#636e72", fontSize: 14, lineHeight: 1.7, margin: "0 auto 24px", maxWidth: 340 }}>
                  Laissez-nous un avis Google, puis revenez ici pour tourner la roue et gagner un cadeau !
                </p>
                <a
                  onClick={handleReviewClick}
                  href={entreprise.lien_avis || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "17px 36px", borderRadius: 16, textDecoration: "none",
                    background: `linear-gradient(135deg, ${pc}, ${sc})`,
                    color: "#fff", fontWeight: 800, fontSize: 16,
                    boxShadow: `0 8px 32px ${pc}44`,
                    animation: "pulse 2s infinite",
                    cursor: "pointer",
                  }}
                >
                  ⭐ Laisser mon avis Google
                </a>
                <p style={{ color: "#b2bec3", fontSize: 12, marginTop: 16 }}>
                  Vous serez redirigé vers Google Maps
                </p>
              </div>
            ) : (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#00B89415", border: "1.5px solid #00B89430",
                  borderRadius: 12, padding: "10px 20px", marginBottom: 16,
                }}>
                  <span style={{ color: "#00B894", fontWeight: 800, fontSize: 14 }}>✓ Merci pour votre avis !</span>
                </div>
                <p style={{ color: "#636e72", fontSize: 14, margin: "0 0 20px" }}>
                  Tournez maintenant la roue pour découvrir votre cadeau.
                </p>
              </div>
            )}

            {/* La roue */}
            <SpinWheel
              rewards={entreprise.rewards}
              primaryColor={pc}
              secondaryColor={sc}
              disabled={!reviewClicked}
              onResult={handleSpinResult}
            />

            {/* Réseaux sociaux */}
            {entreprise.socials && entreprise.socials.length > 0 && (
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
                {entreprise.socials.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: "8px 16px", borderRadius: 10,
                      background: "#fff", border: "1.5px solid #E2E8F0",
                      color: "#636e72", fontSize: 13, fontWeight: 600,
                      textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {s.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3 : Résultat + code unique ── */}
        {step === 3 && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: 72, marginBottom: 8, lineHeight: 1 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0F0F1A", margin: "0 0 8px" }}>
              Félicitations !
            </h2>
            <p style={{ color: "#636e72", fontSize: 16, margin: "0 0 28px" }}>
              Vous avez gagné :
            </p>

            {/* Prize */}
            <div style={{
              background: `linear-gradient(135deg, ${pc}15, ${sc}10)`,
              border: `2px solid ${pc}30`,
              borderRadius: 20, padding: "20px 28px", marginBottom: 28,
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: pc }}>
                {result?.rewardName}
              </div>
            </div>

            {/* Code gagnant */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 13, color: "#718096", marginBottom: 12, fontWeight: 600 }}>
                Votre code unique — montrez-le au personnel
              </p>
              <div
                onClick={copyCode}
                style={{
                  background: "#0F0F1A", borderRadius: 16, padding: "20px 24px",
                  cursor: "pointer", position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 28, fontWeight: 700, color: "#fff",
                  letterSpacing: 4,
                }}>
                  {generating ? "…" : winCode}
                </span>
                <span style={{
                  position: "absolute", top: 8, right: 12,
                  fontSize: 11, color: "#718096", fontWeight: 600,
                }}>
                  {copied ? "✓ Copié !" : "Appuyer pour copier"}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div style={{
              background: "#F8FAFC", borderRadius: 16, padding: "20px 24px",
              border: "1.5px solid #E2E8F0", textAlign: "left",
            }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#0F0F1A", margin: "0 0 12px" }}>
                Comment récupérer votre cadeau ?
              </p>
              {[
                "Prenez une capture d'écran ou notez votre code",
                `Présentez-vous à ${entreprise.nom}`,
                "Montrez ce code au personnel",
                "Récupérez votre récompense !",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: pc, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 14, color: "#4a5568" }}>{step}</span>
                </div>
              ))}
            </div>

            {/* Réseaux sociaux */}
            {entreprise.socials && entreprise.socials.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 13, color: "#b2bec3", marginBottom: 10 }}>Suivez-nous !</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  {entreprise.socials.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: "8px 16px", borderRadius: 10,
                        background: "#fff", border: "1.5px solid #E2E8F0",
                        color: "#636e72", fontSize: 13, fontWeight: 600,
                        textDecoration: "none",
                      }}>
                      {s.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{
        textAlign: "center", padding: "16px", fontSize: 12, color: "#b2bec3",
        borderTop: "1px solid #f0f0f5",
      }}>
        Propulsé par{" "}
        <a href="/" style={{ color: pc, fontWeight: 700, textDecoration: "none" }}>zReview</a>
      </footer>
    </div>
  );
}
