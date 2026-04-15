import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Home, TrendingUp, Sparkles, MapPin, ArrowRight, BarChart2, FileText, Star } from "lucide-react";

const NEIGHBORHOODS = [
  "Summerlin", "Henderson", "Anthem", "Southern Highlands",
  "MacDonald Highlands", "Green Valley Ranch", "The Ridges", "Skye Canyon",
];

const STATS = [
  { value: "1,400+", label: "Career Sales" },
  { value: "$418M+", label: "Closed Volume" },
  { value: "900+", label: "Five-Star Reviews" },
  { value: "20+ yrs", label: "Las Vegas Expert" },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Weekly Market Intelligence",
    desc: "Real search data from SEMrush — the exact questions buyers and sellers are asking right now in the Las Vegas valley.",
  },
  {
    icon: Sparkles,
    title: "AI Article Generation",
    desc: "Venice AI writes in Tom Heuser's voice. Honest, data-grounded, specific to Las Vegas neighborhoods. No fluff.",
  },
  {
    icon: Star,
    title: "Top 3 AI Picks",
    desc: "An AI agent evaluates every question by purchase intent, local advantage, and timing — then selects and writes the top 3.",
  },
  {
    icon: BarChart2,
    title: "SEO-Optimized Content",
    desc: "Every article targets real search volume with keyword difficulty scoring. Built to rank, built to convert.",
  },
  {
    icon: FileText,
    title: "Infographic Export",
    desc: "Beautiful single-page infographic layouts ready for print, PDF, or your CMS. Professional visuals, zero effort.",
  },
  {
    icon: MapPin,
    title: "Social Media Publishing",
    desc: "Post directly to Instagram, Facebook, and Twitter/X with platform-optimized layouts and auto-generated captions.",
  },
];

export default function LandingPage({ onEnter, stats }) {
  const canvasRef = useRef(null);

  // Subtle animated gold particle field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const particles = [];

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 55; i++) {
      particles.push({
        x:    Math.random() * canvas.width,
        y:    Math.random() * canvas.height,
        r:    Math.random() * 1.4 + 0.3,
        vx:   (Math.random() - 0.5) * 0.18,
        vy:   (Math.random() - 0.5) * 0.18,
        a:    Math.random() * 0.5 + 0.1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,109,31,${p.a * 0.5})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="landing-page" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", overflowY: "auto", height: "100%" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="landing-hero" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>

        {/* Particle canvas */}
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

        {/* Radial glow behind headline */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", width: "700px", height: "500px", background: "radial-gradient(ellipse at center, rgba(140,109,31,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Nav bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 40px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home size={16} color="var(--gold)" />
            </div>
            <div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>GoRealestate</span>
              <span style={{ display: "block", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginTop: 2 }}>Las Vegas · Clark County</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 999, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold-light)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            Open Platform <ArrowRight size={13} />
          </motion.button>
        </div>

        {/* Headline block */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", maxWidth: 780, padding: "0 32px", position: "relative", zIndex: 1 }}
        >
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", marginBottom: 32 }}>
            <Sparkles size={12} color="var(--gold)" />
            <span style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--gold)" }}>
              AI-Powered Market Intelligence
            </span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.6rem, 6vw, 4.2rem)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 28 }}>
            The Las Vegas Real Estate<br />
            <span style={{ color: "var(--gold)" }}>Content Engine</span>
          </h1>

          <p style={{ fontSize: "1.05rem", lineHeight: 1.75, color: "var(--text-secondary)", marginBottom: 44, maxWidth: 580, margin: "0 auto 44px" }}>
            Weekly SEO intelligence, AI-written articles in Tom Heuser's voice, and one-click publishing to Instagram, Facebook, and Twitter. Built for Las Vegas luxury real estate.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(140,109,31,0.25)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 32px", borderRadius: 999, background: "var(--gold)", color: "#ffffff", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "Inter, sans-serif", letterSpacing: "0.01em" }}
            >
              Open Platform <ArrowRight size={15} />
            </motion.button>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
              {stats?.articles ?? 0} articles generated
            </span>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)" }}>Learn more</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            style={{ width: 1, height: 28, background: "linear-gradient(to bottom, var(--gold-border), transparent)" }}
          />
        </motion.div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", padding: "40px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{ textAlign: "center", padding: "0 24px", borderRight: i < 3 ? "1px solid var(--border-subtle)" : "none" }}
            >
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 700, color: "var(--gold)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.7rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginTop: 8 }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "100px 40px" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            Everything you need to dominate<br />the Las Vegas content game
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            One platform. Weekly research, AI writing, beautiful infographics, and social publishing — all in Tom's voice.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              style={{ padding: "28px 28px", borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color="var(--gold)" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Neighborhoods strip ───────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", padding: "28px 40px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <MapPin size={12} color="var(--gold)" style={{ flexShrink: 0 }} />
          {NEIGHBORHOODS.map((n, i) => (
            <React.Fragment key={n}>
              <span style={{ fontSize: "0.72rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>{n}</span>
              {i < NEIGHBORHOODS.length - 1 && <span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>·</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "120px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "400px", background: "radial-gradient(ellipse at center, rgba(140,109,31,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
            Ready to publish?
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: 40, maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Open the platform, generate this week's top 3 articles, and post to social media in under 5 minutes.
          </p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 8px 40px rgba(140,109,31,0.28)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px", borderRadius: 999, background: "var(--gold)", color: "#ffffff", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "Inter, sans-serif" }}
          >
            Open Platform <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home size={13} color="var(--gold)" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>GoRealestate</span>
        </div>
        <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-muted)" }}>Las Vegas · Henderson · Summerlin · Clark County, NV</span>
        <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-muted)" }}>Powered by Venice AI · SEMrush</span>
      </footer>
    </div>
  );
}
