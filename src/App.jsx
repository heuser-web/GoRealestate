import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  TrendingUp, RefreshCw, Copy, Check, ChevronDown, ChevronRight,
  Sparkles, Database, Cpu, Clock, FileText, BarChart2, AlertCircle,
  BookOpen, Zap, MapPin, Home, Star, Printer, Layout, FileCode,
  Share2, RotateCcw,
} from "lucide-react";
import LandingPage from "./LandingPage.jsx";
import SocialPostModal from "./SocialPostModal.jsx";

// ── Las Vegas luxury home photos (Unsplash) ───────────────────────────────────
const LV_PHOTOS = [
  { id: "1600596542815-ffad4c1539a9", alt: "Modern luxury home exterior in Las Vegas" },
  { id: "1580587771525-78b9dba3b914", alt: "Elegant estate with desert landscaping" },
  { id: "1564013799919-ab600027ffc6", alt: "Contemporary home in Summerlin, Nevada" },
  { id: "1512917774080-9991f1c4c750", alt: "Upscale property in Henderson" },
  { id: "1568605114967-8130f3a36994", alt: "Beautiful home in Green Valley Ranch" },
  { id: "1583608205776-bfd35f0d9f83", alt: "Luxury residence in Southern Highlands" },
  { id: "1600607687939-b0de0c5a7146", alt: "Premium home with pool in The Ridges" },
  { id: "1600047509807-ba8f99d2cdde", alt: "Spacious estate in MacDonald Highlands" },
  { id: "1613490493576-7fde63acd811", alt: "Luxury real estate in Clark County" },
  { id: "1560185893-a55cbc8c57e8", alt: "Designer interior of a Las Vegas luxury home" },
];

function photoForArticle(articleId) {
  if (!articleId) return LV_PHOTOS[0];
  let h = 0;
  for (let i = 0; i < articleId.length; i++) h = (h * 31 + articleId.charCodeAt(i)) | 0;
  return LV_PHOTOS[Math.abs(h) % LV_PHOTOS.length];
}

// ── Utility ──────────────────────────────────────────────────────────────────
function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function formatVolume(n) {
  if (!n) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function extractTitle(markdown) {
  const line = (markdown ?? "").split("\n").find((l) => l.startsWith("# "));
  return line ? line.replace(/^#\s+/, "") : "";
}

function bodyWithoutTitle(markdown) {
  const lines = (markdown ?? "").split("\n");
  const idx   = lines.findIndex((l) => l.startsWith("# "));
  return idx >= 0 ? lines.slice(idx + 1).join("\n").trimStart() : markdown;
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchWeeklyQuestions() {
  const r = await fetch("/api/questions/weekly");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function fetchHistory() {
  const r = await fetch("/api/questions/history");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function fetchArticles() {
  const r = await fetch("/api/articles");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function fetchTop3() {
  const r = await fetch("/api/top3");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function generateArticle(question) {
  const r = await fetch("/api/synthesize", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      prompt:  question.keyword,
      context: { volume: question.volume, difficulty: question.difficulty },
    }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function triggerAutoGenerate() {
  const r    = await fetch("/api/auto-generate", { method: "POST" });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text.trim()); }
  catch { throw new Error("Generation timed out or returned an empty response. Try again."); }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function refreshQuestions() {
  const r = await fetch("/api/questions/refresh", { method: "POST" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const colors = { online: "bg-emerald-500", loading: "bg-amber-400 pulse-gold", error: "bg-red-500" };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status] ?? colors.online}`}
      style={{ boxShadow: status === "online" ? "0 0 6px rgba(16,185,129,0.5)" : "none" }}
    />
  );
}

function VolumeBar({ volume }) {
  const pct = Math.min(((volume ?? 0) / 200) * 100, 100);
  return (
    <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "var(--bg-card-hover)", width: "48px" }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gold)", transition: "width 0.6s ease" }} />
    </div>
  );
}

function QuestionItem({ q, index, isActive, isGenerating, isTop3Pick, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onSelect(q)}
      disabled={isGenerating}
      className={`w-full text-left p-3 rounded-lg border transition-all group relative ${
        isActive
          ? "border-[var(--gold-border)] bg-[var(--gold-dim)]"
          : "border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-card)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="font-mono text-[10px] mt-0.5 w-5 flex-shrink-0 text-right"
          style={{ color: isActive ? "var(--gold)" : "var(--text-muted)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug mb-2" style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isActive ? 500 : 400 }}>
            {q.keyword}
          </p>
          <div className="flex items-center gap-3">
            <VolumeBar volume={q.volume} />
            <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{formatVolume(q.volume)}/mo</span>
            {q.difficulty > 0 && (
              <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>KD {q.difficulty}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isTop3Pick && (
            <Star className="w-3 h-3" style={{ color: "var(--gold)", fill: "var(--gold)" }} />
          )}
          <Sparkles
            className={`w-3 h-3 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`}
            style={{ color: "var(--gold)" }}
          />
        </div>
      </div>
      {isActive && isGenerating && (
        <div className="absolute inset-0 rounded-lg border border-[var(--gold-border)] pointer-events-none">
          <div
            className="absolute inset-0 rounded-lg"
            style={{ background: "linear-gradient(90deg, transparent, var(--gold-glow), transparent)", animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%" }}
          />
        </div>
      )}
    </motion.button>
  );
}

function Top3Item({ item, index, isActive, onSelect }) {
  const { question: q, article } = item;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => onSelect(q, article, "infographic")}
      className="w-full text-left rounded-xl overflow-hidden border transition-all group"
      style={{
        borderColor: isActive ? "var(--gold)" : "var(--gold-border)",
        background:  isActive ? "var(--gold-dim)" : "rgba(201,168,76,0.06)",
      }}
    >
      {/* Mini photo header */}
      {article && (
        <div className="relative h-16 overflow-hidden">
          <img
            src={`https://images.unsplash.com/photo-${photoForArticle(article.id).id}?auto=format&fit=crop&w=400&q=70`}
            alt="Las Vegas home"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
          <div className="absolute bottom-1.5 left-2">
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--gold)" }}>
              ★ AI Pick {index + 1}
            </span>
          </div>
        </div>
      )}
      <div className="p-3">
        <p className="text-[11px] leading-snug font-medium" style={{ color: "var(--text-primary)" }}>
          {q.keyword}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{formatVolume(q.volume)}/mo</span>
          {article ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
              Ready
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Pending</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function HistoryWeek({ week, data, isOpen, onToggle }) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-[var(--bg-card)]"
      >
        <div>
          <p className="text-xs font-mono" style={{ color: "var(--gold)" }}>{week}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {data.questions?.length ?? 0} questions · {data.articlesGenerated ?? 0} articles
          </p>
        </div>
        {isOpen
          ? <ChevronDown  className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          : <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        }
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-3 pb-3 space-y-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {data.questions?.slice(0, 5).map((q, i) => (
                <p key={i} className="text-[11px] py-1" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{i + 1}.</span> {q.keyword}
                </p>
              ))}
              {(data.questions?.length ?? 0) > 5 && (
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{data.questions.length - 5} more</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="space-y-4 fade-up">
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-4 w-1/3" />
      <div className="gold-divider my-6" />
      <div className="space-y-2">
        {[100, 90, 95, 85, 100].map((w, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="skeleton h-5 w-1/2 mt-6" />
      <div className="space-y-2">
        {[92, 88, 96].map((w, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

function AutoGenSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 pulse-gold"
           style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
        <Star className="w-8 h-8" style={{ color: "var(--gold)" }} />
      </div>
      <h2 className="font-serif text-2xl mb-2" style={{ color: "var(--text-primary)" }}>AI Agent Running</h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Analyzing this week's questions, selecting the top 3,<br />and writing your articles…
      </p>
      <div className="space-y-3 w-full max-w-xs">
        {["Evaluating 10 questions…", "Selecting top 3 by purchase intent…", "Generating articles via Venice AI…"].map((step, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ background: "var(--bg-card)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 pulse-gold"
                 style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
              <span className="text-[9px] font-mono" style={{ color: "var(--gold)" }}>{i + 1}</span>
            </div>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{step}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WelcomeScreen({ questionCount, articleCount, top3Count }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
           style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
        <Home className="w-8 h-8" style={{ color: "var(--gold)" }} />
      </div>
      <h2 className="font-serif text-3xl mb-3" style={{ color: "var(--text-primary)" }}>Las Vegas Luxury Infographics</h2>
      <p className="text-sm mb-8 max-w-md leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Click <strong style={{ color: "var(--gold)" }}>Generate Top 3</strong> to let the AI agent select
        the highest-impact questions and write editorial infographics in Tom Heuser's voice — or pick any question manually from the left.
      </p>
      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
        {[
          { label: "Questions This Week", value: questionCount, icon: BarChart2 },
          { label: "Top 3 Infographics",  value: top3Count,     icon: Star      },
          { label: "Articles Generated",  value: articleCount,  icon: FileText  },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl p-4 text-center"
               style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: "var(--gold)" }} />
            <div className="font-mono text-lg font-medium" style={{ color: "var(--text-primary)" }}>{value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 rounded-lg text-xs"
           style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold-light)" }}>
        <MapPin className="w-3 h-3 inline mr-1.5 -mt-0.5" />
        Summerlin · Henderson · Seven Hills · Green Valley Ranch · Anthem · Southern Highlands
      </div>
    </motion.div>
  );
}

// ── Article View (markdown) ───────────────────────────────────────────────────
function ArticleView({ article, onCopy, copied, viewMode, onViewMode, onRegenerate, isRegenerating, onSocialShare }) {
  const wordCount = countWords(article.content);
  return (
    <motion.div key={article.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider"
                style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
            {wordCount} words
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
            {new Date(article.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          {article.tokens > 0 && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              <Cpu className="w-3 h-3 inline mr-1 -mt-0.5" />
              {article.tokens.toLocaleString()} tokens
            </span>
          )}
          {article.isTop3 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                  style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
              <Star className="w-2.5 h-2.5" style={{ fill: "var(--gold)" }} /> AI Top Pick
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-subtle)" }}>
            <button
              onClick={() => onViewMode("article")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors"
              style={{ background: viewMode === "article" ? "var(--bg-card)" : "transparent", color: viewMode === "article" ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              <FileCode className="w-3 h-3" /> Article
            </button>
            <button
              onClick={() => onViewMode("infographic")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors"
              style={{ background: viewMode === "infographic" ? "var(--gold-dim)" : "transparent", color: viewMode === "infographic" ? "var(--gold)" : "var(--text-muted)" }}
            >
              <Layout className="w-3 h-3" /> Infographic
            </button>
          </div>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: copied ? "rgba(16,185,129,0.1)" : "var(--bg-card)",
              border:     `1px solid ${copied ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
              color:      copied ? "#10b981" : "var(--text-secondary)",
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy to CMS"}
          </button>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            title="Regenerate article"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating…" : "Regenerate"}
          </button>
          <button
            onClick={onSocialShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold-light)" }}
            title="Share to social media"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>
      <div className="gold-divider mb-8 flex-shrink-0" />
      <div className="flex-1 overflow-y-auto pr-2">
        <article className="article-content max-w-2xl">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </article>
      </div>
    </motion.div>
  );
}

// ── Infographic View — editorial two-column layout ───────────────────────────
function InfographicView({ article, onCopy, copied, viewMode, onViewMode, onRegenerate, isRegenerating, onSocialShare }) {
  const photo     = photoForArticle(article.id);
  const wordCount = countWords(article.content);
  const title     = extractTitle(article.content) || article.keyword;
  const body      = bodyWithoutTitle(article.content);
  const photoUrl  = `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=900&q=85`;
  const dateStr   = new Date(article.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  function handlePrint() { window.print(); }

  return (
    <motion.div key={article.id + "-ig"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                className="h-full flex flex-col">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider"
                style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
            {wordCount} words
          </span>
          {article.isTop3 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                  style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
              <Star className="w-2.5 h-2.5" style={{ fill: "var(--gold)" }} /> AI Top Pick
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-subtle)" }}>
            <button
              onClick={() => onViewMode("article")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors"
              style={{ background: viewMode === "article" ? "var(--bg-card)" : "transparent", color: viewMode === "article" ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              <FileCode className="w-3 h-3" /> Article
            </button>
            <button
              onClick={() => onViewMode("infographic")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors"
              style={{ background: viewMode === "infographic" ? "var(--gold-dim)" : "transparent", color: viewMode === "infographic" ? "var(--gold)" : "var(--text-muted)" }}
            >
              <Layout className="w-3 h-3" /> Infographic
            </button>
          </div>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
          <button onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: copied ? "rgba(16,185,129,0.1)" : "var(--bg-card)",
              border:     `1px solid ${copied ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
              color:      copied ? "#10b981" : "var(--text-secondary)",
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={onRegenerate} disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
            title="Regenerate article"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating…" : "Regenerate"}
          </button>
          <button onClick={onSocialShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}
            title="Share to social media"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      {/* ── Editorial card ── */}
      <div className="flex-1 overflow-y-auto">
        <div id="infographic-print" className="mx-auto rounded-2xl overflow-hidden infographic-card"
             style={{ maxWidth: "920px", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>

          {/* Two-column: photo left · content right */}
          <div style={{ display: "flex", alignItems: "stretch", minHeight: "540px" }}>

            {/* Left — photo panel */}
            <div style={{ width: "42%", flexShrink: 0, position: "relative", minHeight: "540px" }}>
              <img
                src={photoUrl}
                alt={photo.alt}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.style.background = "linear-gradient(160deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)";
                }}
              />
              {/* Gradient overlay — badges at bottom */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, background: "var(--gold)", color: "#fff", fontSize: "0.58rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                      Las Vegas · Clark County
                    </span>
                    {article.isTop3 && (
                      <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.22)", fontSize: "0.58rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        ★ AI Top Pick
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{photo.alt}</p>
                </div>
              </div>
            </div>

            {/* Right — article content */}
            <div style={{ flex: 1, padding: "44px 48px 36px", display: "flex", flexDirection: "column", background: "var(--bg-secondary)", minWidth: 0 }}>

              {/* Eyebrow */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
                <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--gold)", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Home className="w-3 h-3" style={{ color: "var(--gold)" }} />
                  GoRealestate · Infographics
                </span>
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{dateStr}</span>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: "22px", marginBottom: "22px", paddingBottom: "18px", borderBottom: "1px solid var(--border-subtle)" }}>
                {[
                  { label: "Searches/mo", value: formatVolume(article.volume ?? 0) },
                  { label: "Words",        value: wordCount                          },
                  { label: "Market",       value: "$800K–$2M+"                       },
                  { label: "Territory",    value: "Las Vegas"                        },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600, color: "var(--gold)", lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: "18px", letterSpacing: "-0.01em" }}>
                {title}
              </h1>

              {/* Rule */}
              <div style={{ height: 1, background: "linear-gradient(90deg, var(--gold-border), transparent)", marginBottom: "20px" }} />

              {/* Body */}
              <div style={{ flex: 1 }}>
                <article className="article-content infographic-content max-w-none">
                  <ReactMarkdown>{body}</ReactMarkdown>
                </article>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Home className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>GoRealestate</p>
                <p style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Tom &amp; Serena Heuser · Las Vegas, NV</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{dateStr}</p>
              <p style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Photo via Unsplash</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] mt-3 pb-6" style={{ color: "var(--text-muted)" }}>
          {photo.alt} · Unsplash
        </p>
      </div>
    </motion.div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [showLanding,     setShowLanding]     = useState(() => !localStorage.getItem("gre_entered"));
  const [questions,       setQuestions]       = useState([]);
  const [history,         setHistory]         = useState({});
  const [articles,        setArticles]        = useState([]);
  const [top3,            setTop3]            = useState([]);
  const [activeQuestion,  setActiveQuestion]  = useState(null);
  const [activeArticle,   setActiveArticle]   = useState(null);
  const [viewMode,        setViewMode]        = useState("article");
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [isAutoGen,       setIsAutoGen]       = useState(false);
  const [isRegenerating,  setIsRegenerating]  = useState(false);
  const [qLoading,        setQLoading]        = useState(true);
  const [error,           setError]           = useState(null);
  const [openHistoryWeek, setOpenHistoryWeek] = useState(null);
  const [copied,          setCopied]          = useState(false);
  const [totalTokens,     setTotalTokens]     = useState(0);
  const [semrushStatus,   setSemrushStatus]   = useState("online");
  const [veniceStatus,    setVeniceStatus]    = useState("online");
  const [weekLabel,       setWeekLabel]       = useState("");
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialConnected, setSocialConnected] = useState({});

  useEffect(() => { loadAll(); fetchSocialStatus(); }, []);

  async function loadAll() {
    setQLoading(true);
    setError(null);
    try {
      const [qs, hist, arts, t3] = await Promise.all([
        fetchWeeklyQuestions(),
        fetchHistory(),
        fetchArticles(),
        fetchTop3(),
      ]);
      setQuestions(qs.questions ?? []);
      setWeekLabel(qs.week ?? "");
      setHistory(hist ?? {});
      setArticles(arts ?? []);
      setTop3(t3.top3 ?? []);
      setTotalTokens((arts ?? []).reduce((s, a) => s + (a.tokens ?? 0), 0));
    } catch (e) {
      setError(e.message);
      setSemrushStatus("error");
    } finally {
      setQLoading(false);
    }
  }

  async function handleSelectQuestion(q, preloadedArticle, preferredView) {
    setActiveQuestion(q);
    const existing = preloadedArticle
      ?? articles.find((a) => a.keyword.toLowerCase() === q.keyword.toLowerCase());

    if (existing) {
      setActiveArticle(existing);
      if (preferredView) setViewMode(preferredView);
      return;
    }

    setActiveArticle(null);
    setIsGenerating(true);
    setVeniceStatus("loading");
    try {
      const result     = await generateArticle(q);
      const newArticle = result.article;
      setActiveArticle(newArticle);
      setArticles((prev) => [newArticle, ...prev]);
      setTotalTokens((t) => t + (newArticle.tokens ?? 0));
      const hist = await fetchHistory();
      setHistory(hist ?? {});
    } catch (e) {
      setError(`Generation failed: ${e.message}`);
      setVeniceStatus("error");
    } finally {
      setIsGenerating(false);
      setVeniceStatus("online");
    }
  }

  async function handleAutoGenerate() {
    setIsAutoGen(true);
    setError(null);
    setSemrushStatus("loading");
    setVeniceStatus("loading");
    try {
      const result = await triggerAutoGenerate();
      // Refresh all data after generation
      await loadAll();
      // Auto-open first successfully generated article in infographic mode
      const first = result.results?.find((r) => r.article && !r.skipped);
      if (first?.article) {
        setActiveArticle(first.article);
        setActiveQuestion({ keyword: first.article.keyword });
        setViewMode("infographic");
      }
      setSemrushStatus("online");
      setVeniceStatus("online");
    } catch (e) {
      setError(`Auto-generate failed: ${e.message}`);
      setSemrushStatus("error");
      setVeniceStatus("error");
    } finally {
      setIsAutoGen(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    setSemrushStatus("loading");
    setError(null);
    try {
      await refreshQuestions();
      await loadAll();
      setSemrushStatus("online");
    } catch (e) {
      setError(`Refresh failed: ${e.message}`);
      setSemrushStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleEnterPlatform() {
    localStorage.setItem("gre_entered", "1");
    setShowLanding(false);
  }

  async function fetchSocialStatus() {
    try {
      const r = await fetch("/api/social/status");
      if (r.ok) setSocialConnected(await r.json());
    } catch { /* non-critical */ }
  }

  async function handleRegenerate() {
    if (!activeArticle) return;
    setIsRegenerating(true);
    setVeniceStatus("loading");
    setError(null);
    try {
      const r = await fetch("/api/regenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: activeArticle.id }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { article: updated } = await r.json();
      setActiveArticle(updated);
      setArticles((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      setVeniceStatus("online");
    } catch (e) {
      setError(`Regenerate failed: ${e.message}`);
      setVeniceStatus("error");
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleCopy() {
    if (!activeArticle) return;
    navigator.clipboard.writeText(activeArticle.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const top3Keywords      = new Set(top3.map((t) => t.question?.keyword?.toLowerCase()));
  const historyEntries    = Object.entries(history).sort(([a], [b]) => b.localeCompare(a));
  const top3ArticleCount  = top3.filter((t) => t.article).length;

  const showInfographic = activeArticle && viewMode === "infographic";
  const showArticle     = activeArticle && viewMode === "article";

  if (showLanding) {
    return (
      <LandingPage
        onEnter={handleEnterPlatform}
        stats={{ articles: articles.length }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
            <Home className="w-4 h-4" style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold leading-none" style={{ color: "var(--text-primary)" }}>Infographics</h1>
            <p className="text-[10px] mt-0.5 font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              GoRealestate · Las Vegas · Summerlin · $800K–$2M+ Market
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowLanding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
          >
            <Home className="w-3 h-3" /> Home
          </button>
          <div className="flex items-center gap-1.5">
            <StatusDot status={semrushStatus} />
            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>SEMrush</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={veniceStatus} />
            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>Venice AI</span>
          </div>
          <div className="h-4 w-px" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{totalTokens.toLocaleString()} tokens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{articles.length} articles</span>
          </div>
        </div>
      </header>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-2.5 text-xs"
            style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Three-Panel Layout ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Weekly Questions + Top 3 */}
        <aside className="flex flex-col w-72 flex-shrink-0 overflow-hidden"
               style={{ borderRight: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
               style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Weekly Questions</span>
              </div>
              {weekLabel && <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{weekLabel}</p>}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || qLoading}
              title="Refresh from SEMrush"
              className="p-1.5 rounded-lg transition-all hover:bg-[var(--bg-card)] disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Generate Top 3 button */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <button
              onClick={handleAutoGenerate}
              disabled={isAutoGen || isGenerating || qLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              style={{
                background:   isAutoGen ? "var(--gold-dim)" : "var(--gold)",
                color:        isAutoGen ? "var(--gold)"     : "#ffffff",
                border:       "1px solid var(--gold-border)",
              }}
            >
              {isAutoGen ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 pulse-gold" /> AI Agent Running…
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5" /> Generate Weekly Top 3
                </>
              )}
            </button>
          </div>

          {/* Top 3 AI Picks section */}
          {top3.length > 0 && (
            <div className="px-3 pb-2 flex-shrink-0">
              <p className="text-[9px] font-mono uppercase tracking-widest mb-2 px-1"
                 style={{ color: "var(--gold)" }}>★ AI Top Picks This Week</p>
              <div className="space-y-2">
                {top3.map((item, i) => (
                  <Top3Item
                    key={item.question?.keyword}
                    item={item}
                    index={i}
                    isActive={activeQuestion?.keyword === item.question?.keyword}
                    onSelect={(q, article) => handleSelectQuestion(q, article, "infographic")}
                  />
                ))}
              </div>
              <div className="gold-divider mt-3 mb-1" />
              <p className="text-[9px] font-mono uppercase tracking-widest mb-1 px-1 mt-3"
                 style={{ color: "var(--text-muted)" }}>All Questions</p>
            </div>
          )}

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {qLoading ? (
              <div className="space-y-2 pt-2">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Database className="w-8 h-8 mb-3" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No questions yet</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Click refresh to pull from SEMrush</p>
              </div>
            ) : (
              questions.map((q, i) => (
                <QuestionItem
                  key={q.keyword}
                  q={q}
                  index={i}
                  isActive={activeQuestion?.keyword === q.keyword}
                  isGenerating={isGenerating && activeQuestion?.keyword === q.keyword}
                  isTop3Pick={top3Keywords.has(q.keyword?.toLowerCase())}
                  onSelect={(q) => handleSelectQuestion(q)}
                />
              ))
            )}
          </div>

          <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <p className="text-[10px] text-center font-mono" style={{ color: "var(--text-muted)" }}>
              SEMrush → AI Agent → Venice AI · Auto-refreshes weekly
            </p>
          </div>
        </aside>

        {/* CENTER: Article / Infographic Workspace */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-10 py-8">
            {isAutoGen ? (
              <AutoGenSkeleton />
            ) : isGenerating ? (
              <ArticleSkeleton />
            ) : showInfographic ? (
              <InfographicView
                article={activeArticle}
                onCopy={handleCopy}
                copied={copied}
                viewMode={viewMode}
                onViewMode={setViewMode}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
                onSocialShare={() => setSocialModalOpen(true)}
              />
            ) : showArticle ? (
              <ArticleView
                article={activeArticle}
                onCopy={handleCopy}
                copied={copied}
                viewMode={viewMode}
                onViewMode={setViewMode}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
                onSocialShare={() => setSocialModalOpen(true)}
              />
            ) : (
              <WelcomeScreen
                questionCount={questions.length}
                articleCount={articles.length}
                top3Count={top3ArticleCount}
              />
            )}
          </div>

          {/* Generating status bar */}
          <AnimatePresence>
            {(isGenerating || isAutoGen) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="flex-shrink-0 flex items-center gap-2 px-10 py-3"
                style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}
              >
                <Zap className="w-3.5 h-3.5 pulse-gold" style={{ color: "var(--gold)" }} />
                <span className="text-xs font-mono" style={{ color: "var(--gold)" }}>
                  {isAutoGen
                    ? "AI Agent: selecting top 3 questions + generating infographic articles…"
                    : `Venice AI synthesizing article for "${activeQuestion?.keyword}"…`
                  }
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-shrink-0 flex items-center justify-between px-10 py-2.5"
               style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              SEMrush → AI Agent → Venice AI → Infographics · Summerlin · Henderson · $800K–$2M+
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>GoRealestate · Infographics v2.0</span>
          </div>
        </main>

        {/* RIGHT: History + Article Library */}
        <aside className="flex flex-col w-60 flex-shrink-0 overflow-hidden"
               style={{ borderLeft: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}>
          <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
               style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Research History</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {historyEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-3 pt-8">
                <Clock className="w-7 h-7 mb-2" style={{ color: "var(--text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  History builds week by week. Check back after the first automated pull.
                </p>
              </div>
            ) : (
              historyEntries.map(([week, data]) => (
                <HistoryWeek
                  key={week}
                  week={week}
                  data={data}
                  isOpen={openHistoryWeek === week}
                  onToggle={() => setOpenHistoryWeek(openHistoryWeek === week ? null : week)}
                />
              ))
            )}
          </div>

          {articles.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Generated Articles
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {articles.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setActiveArticle(a);
                      setActiveQuestion({ keyword: a.keyword });
                      setViewMode(a.isTop3 ? "infographic" : "article");
                    }}
                    className="w-full text-left py-1 px-2 rounded text-[11px] transition-colors hover:bg-[var(--bg-card)] flex items-center gap-1.5"
                    style={{
                      color:      activeArticle?.id === a.id ? "var(--gold)" : "var(--text-secondary)",
                      background: activeArticle?.id === a.id ? "var(--gold-dim)" : "transparent",
                    }}
                  >
                    {a.isTop3 && <Star className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "var(--gold)", fill: "var(--gold)" }} />}
                    <span className="truncate">{a.keyword.length > 34 ? a.keyword.slice(0, 34) + "…" : a.keyword}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Social Post Modal */}
      {socialModalOpen && activeArticle && (
        <SocialPostModal
          article={activeArticle}
          photo={photoForArticle(activeArticle.id)}
          onClose={() => setSocialModalOpen(false)}
          socialConnected={socialConnected}
        />
      )}
    </div>
  );
}
