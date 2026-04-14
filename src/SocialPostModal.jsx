import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Instagram, Twitter, Facebook, Share2, Check, Copy,
  ExternalLink, AlertCircle, Home, MapPin, Loader,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractTitle(markdown) {
  const line = (markdown ?? "").split("\n").find((l) => l.startsWith("# "));
  return line ? line.replace(/^#\s+/, "") : "";
}

function extractFirstParagraph(markdown) {
  const lines = (markdown ?? "").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (t && !t.startsWith("#") && !t.startsWith("*") && !t.startsWith("-") && t.length > 40) {
      return t.length > 200 ? t.slice(0, 197) + "…" : t;
    }
  }
  return "";
}

function formatVolume(n) {
  if (!n) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

// ── Social caption generators ─────────────────────────────────────────────
function buildCaption(platform, article) {
  const title = extractTitle(article.content) || article.keyword;
  const blurb = extractFirstParagraph(article.content);
  const tags = {
    instagram: "#LasVegasRealEstate #Summerlin #Henderson #LasVegasHomes #LuxuryRealEstate #ClarkCounty #GoRealestate #LasVegasLiving #RealEstateTips #BuyingAHome",
    facebook:  "#LasVegasRealEstate #GoRealestate #SummerlinHomes #HendersonNV #LuxuryHomes",
    twitter:   "#LasVegas #RealEstate #GoRealestate #Summerlin",
  };
  const cta = {
    instagram: "📍 Link in bio for the full article.",
    facebook:  "Read the full article at GoRealestate.com →",
    twitter:   "Full article at GoRealestate.com →",
  };

  return `${title}\n\n${blurb}\n\n${cta[platform]}\n\n${tags[platform]}`;
}

// ── Platform tab definitions ──────────────────────────────────────────────
const PLATFORMS = [
  { id: "instagram", label: "Instagram",   icon: Instagram, color: "#E1306C", aspect: "1/1",    w: 420, h: 420 },
  { id: "facebook",  label: "Facebook",    icon: Facebook,  color: "#1877F2", aspect: "16/9",   w: 500, h: 282 },
  { id: "twitter",   label: "Twitter / X", icon: Twitter,   color: "#1DA1F2", aspect: "16/9",   w: 500, h: 282 },
];

// ── Social post card (the actual visual preview) ──────────────────────────
function PostCard({ platform, article, photo }) {
  const title   = extractTitle(article.content) || article.keyword;
  const blurb   = extractFirstParagraph(article.content);
  const isSquare = platform === "instagram";
  const photoUrl = `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=1200&q=85`;

  return (
    <div
      id={`social-card-${platform}`}
      style={{
        width: "100%",
        aspectRatio: isSquare ? "1/1" : "16/9",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        background: "#0b0b0b",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background photo */}
      <img
        src={photoUrl}
        alt={photo.alt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.parentElement.style.background = "linear-gradient(135deg, #1a1205 0%, #2a1e0a 100%)";
        }}
      />

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: isSquare
        ? "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.18) 100%)"
        : "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.1) 100%)"
      }} />

      {/* Content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: isSquare ? "flex-end" : "center",
        padding: isSquare ? "20px 20px" : "20px 28px",
        maxWidth: isSquare ? "100%" : "62%",
      }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: "rgba(201,168,76,0.3)", border: "1px solid rgba(201,168,76,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home size={10} color="#c9a84c" />
          </div>
          <span style={{ fontSize: "0.58rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: "#c9a84c" }}>
            GoRealestate · Las Vegas, NV
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: isSquare ? "clamp(0.95rem, 3.5vw, 1.25rem)" : "clamp(0.85rem, 2vw, 1.1rem)",
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.25,
          marginBottom: 10,
          letterSpacing: "-0.01em",
        }}>
          {title}
        </h2>

        {/* Blurb – only if square or we have room */}
        {(isSquare || blurb.length < 140) && (
          <p style={{
            fontSize: isSquare ? "0.68rem" : "0.62rem",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.55,
            marginBottom: 12,
            display: "-webkit-box",
            WebkitLineClamp: isSquare ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {blurb}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {article.volume > 0 && (
            <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#c9a84c" }}>
              {formatVolume(article.volume)}/mo searches
            </span>
          )}
          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "rgba(255,255,255,0.45)" }}>$500K–$1.5M Market</span>
        </div>
      </div>

      {/* Top-right logo badge */}
      <div style={{
        position: "absolute", top: 14, right: 14,
        padding: "5px 10px", borderRadius: 999,
        background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.4)",
        backdropFilter: "blur(8px)",
      }}>
        <span style={{ fontSize: "0.55rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", color: "#c9a84c", fontWeight: 700 }}>
          GoRealestate
        </span>
      </div>

      {/* Bottom neighborhood strip for Instagram */}
      {isSquare && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "7px 18px", background: "rgba(201,168,76,0.12)", borderTop: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", gap: 5 }}>
          <MapPin size={9} color="rgba(201,168,76,0.7)" />
          <span style={{ fontSize: "0.52rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(201,168,76,0.7)" }}>
            Summerlin · Henderson · Southern Highlands · Clark County
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────
export default function SocialPostModal({ article, photo, onClose, socialConnected }) {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [caption, setCaption]               = useState(() => buildCaption("instagram", article));
  const [copiedCaption, setCopiedCaption]   = useState(false);
  const [posting, setPosting]               = useState(false);
  const [postResult, setPostResult]         = useState(null);
  const [postError, setPostError]           = useState(null);

  function switchPlatform(id) {
    setActivePlatform(id);
    setCaption(buildCaption(id, article));
    setPostResult(null);
    setPostError(null);
  }

  function handleCopyCaption() {
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2200);
  }

  async function handlePost() {
    setPosting(true);
    setPostResult(null);
    setPostError(null);
    try {
      const title    = extractTitle(article.content) || article.keyword;
      const photoUrl = `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=1200&q=85`;

      const res = await fetch("/api/social/post", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: activePlatform,
          caption,
          imageUrl: photoUrl,
          articleId: article.id,
          title,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPostResult(data);
    } catch (e) {
      setPostError(e.message);
    } finally {
      setPosting(false);
    }
  }

  const platform = PLATFORMS.find((p) => p.id === activePlatform);
  const isConnected = socialConnected?.[activePlatform];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 20, width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Share2 size={16} color="var(--gold)" />
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Share to Social Media</span>
            </div>
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 8, background: "transparent", border: "1px solid var(--border-subtle)", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Platform tabs */}
          <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
            {PLATFORMS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => switchPlatform(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "12px 18px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activePlatform === id ? `2px solid ${color}` : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: activePlatform === id ? 600 : 400,
                  color: activePlatform === id ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "all 0.15s",
                  fontFamily: "Inter, sans-serif",
                  marginBottom: -1,
                }}
              >
                <Icon size={14} color={activePlatform === id ? color : "currentColor"} />
                {label}
                {isConnected && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", marginLeft: 2 }} />
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{ display: "flex", gap: 24, padding: 24, flex: 1 }}>

            {/* Left: preview card */}
            <div style={{ flex: "0 0 auto", width: activePlatform === "instagram" ? 320 : 400 }}>
              <p style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 10 }}>
                Preview · {platform?.label}
              </p>
              <PostCard platform={activePlatform} article={article} photo={photo} />
              <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 8, textAlign: "center", fontFamily: "monospace" }}>
                {activePlatform === "instagram" ? "1:1 square" : "16:9 landscape"}
              </p>
            </div>

            {/* Right: caption + actions */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Caption editor */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: "0.7rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                    Caption
                  </label>
                  <button
                    onClick={handleCopyCaption}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", padding: "4px 10px", borderRadius: 6, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", cursor: "pointer", color: copiedCaption ? "#10b981" : "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}
                  >
                    {copiedCaption ? <Check size={11} /> : <Copy size={11} />}
                    {copiedCaption ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={10}
                  style={{
                    width: "100%", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)", fontSize: "0.78rem", lineHeight: 1.65, padding: "12px 14px",
                    fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 5, fontFamily: "monospace" }}>
                  {caption.length} chars · Edit freely before posting
                </p>
              </div>

              {/* Connection status */}
              {!isConnected && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(201,168,76,0.07)", border: "1px solid var(--gold-border)" }}>
                  <AlertCircle size={13} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "var(--gold-light)", fontWeight: 500, marginBottom: 3 }}>
                      {platform?.label} not connected
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Add your API credentials in <strong style={{ color: "var(--text-secondary)" }}>Settings → Social Media</strong> to enable auto-posting. You can still copy the caption above.
                    </p>
                  </div>
                </div>
              )}

              {/* Post result */}
              {postResult && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  <Check size={13} color="#10b981" />
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 500 }}>Posted successfully!</p>
                    {postResult.postUrl && (
                      <a href={postResult.postUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "0.65rem", color: "rgba(16,185,129,0.7)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        View post <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Post error */}
              {postError && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <AlertCircle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: "0.7rem", color: "#f87171", lineHeight: 1.5 }}>{postError}</p>
                </motion.div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 4 }}>
                <button
                  onClick={handleCopyCaption}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "Inter, sans-serif" }}
                >
                  {copiedCaption ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  {copiedCaption ? "Copied!" : "Copy Caption"}
                </button>

                <button
                  onClick={handlePost}
                  disabled={posting || !isConnected}
                  style={{
                    flex: 1.4,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "11px 0", borderRadius: 10,
                    background: isConnected ? platform?.color : "var(--bg-card-hover)",
                    border: isConnected ? "none" : "1px solid var(--border-subtle)",
                    cursor: isConnected && !posting ? "pointer" : "not-allowed",
                    fontSize: "0.82rem", fontWeight: 600,
                    color: isConnected ? "#fff" : "var(--text-muted)",
                    opacity: posting ? 0.7 : 1,
                    fontFamily: "Inter, sans-serif",
                    transition: "opacity 0.15s",
                  }}
                >
                  {posting ? (
                    <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Posting…</>
                  ) : (
                    <>{platform && <platform.icon size={14} />} Post to {platform?.label}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
