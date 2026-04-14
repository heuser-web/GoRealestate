/**
 * GoRealestate — Express API Server
 * Routes: /api/questions/weekly  /api/questions/history  /api/questions/refresh
 *         /api/synthesize  /api/articles  /api/health
 *         /api/top3  /api/auto-generate
 * Cron:   Every Monday 6:00 AM — SEMrush pull → AI agent selects top 3 → auto-generate articles
 */

import express from "express";
import cron from "node-cron";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

const app  = express();
const PORT = process.env.PORT ?? 3010;
const DATA = join(__dirname, "data");
mkdirSync(DATA, { recursive: true });

const HISTORY_FILE  = join(DATA, "history.json");
const ARTICLES_FILE = join(DATA, "articles.json");

app.use(express.json());
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ── Storage helpers ───────────────────────────────────────────────────────────
function readJSON(file, fallback) {
  try { return JSON.parse(readFileSync(file, "utf-8")); }
  catch { return fallback; }
}

function writeJSON(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function getISOWeek() {
  const d    = new Date();
  const day  = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wk   = Math.ceil((((d - jan1) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}

function pruneHistory(history) {
  const keys   = Object.keys(history).sort().reverse().slice(0, 26);
  const pruned = {};
  keys.forEach((k) => (pruned[k] = history[k]));
  return pruned;
}

// ── SEMrush ───────────────────────────────────────────────────────────────────
const SEMRUSH_PHRASES = [
  "Las Vegas real estate",
  "living in Las Vegas",
  "Las Vegas housing market",
  "buying home Las Vegas",
  "Las Vegas home prices",
  "Clark County real estate",
  "Henderson Nevada homes",
  "Summerlin Las Vegas homes",
];

async function fetchSEMrushQuestions(phrase, apiKey) {
  const params = new URLSearchParams({
    type:           "phrase_questions",
    key:            apiKey,
    phrase,
    database:       "us",
    display_limit:  "15",
    display_sort:   "nq_desc",
    export_columns: "Ph,Nq,Kd",
    export_decode:  "1",
  });
  const url  = `https://api.semrush.com/?${params}`;
  const res  = await fetch(url);
  const text = await res.text();
  if (!res.ok || text.startsWith("ERROR")) throw new Error(`SEMrush: ${text.slice(0, 120)}`);

  const lines = text.trim().split("\n").slice(1);
  return lines
    .map((line) => {
      const [keyword, vol, kd] = line.split(";");
      const volume = parseInt(vol, 10) || 0;
      return { keyword: keyword?.trim(), volume, difficulty: parseInt(kd, 10) || 0 };
    })
    .filter((q) => q.keyword && q.volume > 0);
}

async function pullWeeklyQuestions() {
  const apiKey = process.env.SEMRUSH_API_KEY;
  if (!apiKey || apiKey === "your_semrush_api_key_here") {
    console.warn("[SEMrush] API key not set — using seed questions");
    return getSeedQuestions();
  }

  console.log("[SEMrush] Fetching questions for", SEMRUSH_PHRASES.length, "phrases…");
  const results = await Promise.allSettled(
    SEMRUSH_PHRASES.map((p) => fetchSEMrushQuestions(p, apiKey))
  );

  const seen = new Set();
  const all  = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const q of r.value) {
        if (!seen.has(q.keyword)) { seen.add(q.keyword); all.push(q); }
      }
    }
  }

  if (all.length === 0) {
    console.warn("[SEMrush] No results — using seed questions");
    return getSeedQuestions();
  }

  return all.sort((a, b) => b.volume - a.volume).slice(0, 10);
}

function getSeedQuestions() {
  return [
    { keyword: "what is the cost of living in Las Vegas",              volume: 140, difficulty: 21 },
    { keyword: "what is it like living in Las Vegas",                  volume: 140, difficulty: 15 },
    { keyword: "is living in Las Vegas expensive",                     volume: 140, difficulty: 11 },
    { keyword: "are home prices dropping in Las Vegas",                volume: 30,  difficulty: 0  },
    { keyword: "how to buy a home in Las Vegas",                       volume: 30,  difficulty: 0  },
    { keyword: "how is the real estate market in Las Vegas right now", volume: 20,  difficulty: 0  },
    { keyword: "is Las Vegas real estate a good investment",           volume: 20,  difficulty: 0  },
    { keyword: "is Las Vegas real estate overpriced",                  volume: 20,  difficulty: 0  },
    { keyword: "will the housing market crash in Las Vegas",           volume: 20,  difficulty: 0  },
    { keyword: "what is the average home price in Las Vegas",          volume: 20,  difficulty: 0  },
  ];
}

async function runWeeklyPull() {
  const week    = getISOWeek();
  const history = readJSON(HISTORY_FILE, {});

  // Don't overwrite questions that were imported from the SEMrush MCP connector
  if (history[week]?.source === "semrush-mcp") {
    console.log(`[SEMrush] Week ${week} already has MCP-sourced data — skipping API pull`);
    return { week, questions: history[week].questions };
  }

  const questions = await pullWeeklyQuestions();

  history[week] = {
    fetchedAt:         new Date().toISOString(),
    questions,
    articlesGenerated: history[week]?.articlesGenerated ?? 0,
    top3:              history[week]?.top3 ?? [],
  };

  writeJSON(HISTORY_FILE, pruneHistory(history));
  console.log(`[SEMrush] ✓ ${questions.length} questions stored for ${week}`);
  return { week, questions };
}

// ── Venice AI ─────────────────────────────────────────────────────────────────
const VENICE_URL   = "https://api.venice.ai/api/v1/chat/completions";
const VENICE_MODEL = process.env.VENICE_MODEL ?? "llama-3.3-70b";

const SYSTEM_PROMPT = `You are a luxury real estate content specialist for GoRealestate, serving the Las Vegas metropolitan area and Clark County, Nevada. Your clients are buyers and sellers of properties in the $500,000–$1,500,000 range.

Write professional, inviting, SEO-optimized articles that position GoRealestate as the premier real estate authority in Las Vegas. Write like a knowledgeable local agent, not a marketer.

Style guidelines:
- Tone: Expert, warm, and conversational — like a trusted advisor who has lived and worked in Las Vegas for years
- Length: 400–600 words for lifestyle/cost questions; 700–1,000 words for market analysis or strategy questions
- Structure: Compelling # title, scannable ## section headers, 1–2 bullet lists max, memorable closing paragraph
- Neighborhoods to weave in naturally when relevant: Summerlin, Henderson, Seven Hills, Rhodes Ranch, Green Valley Ranch, Mountains Edge, Anthem, Southern Highlands, The Ridges, MacDonald Highlands
- Always include: at least one specific price or market data point, a local insight only an agent would know, and one actionable tip
- Closing: One warm invitation to connect with a GoRealestate agent — genuine, never salesy
- Format: Markdown — # for title, ## for major sections, **bold** for key terms
- Avoid real estate clichés like "dream home," "perfect property," or "hot market" — be specific and grounded
- If uncertain about a specific statistic, use phrases like "market data suggests" or "in recent quarters" — never fabricate numbers`;

async function synthesizeArticle(keyword, semrushContext) {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey || apiKey === "your_venice_api_key_here") {
    throw new Error("Venice API key not configured.");
  }

  const userPrompt = `Write a professional real estate article that fully answers this search question: "${keyword}"

SEO context:
- Monthly search volume: ${semrushContext?.volume ?? "unknown"} searches/month
- Keyword difficulty: ${semrushContext?.difficulty ?? "unknown"}/100

Audience: buyers and sellers in the Las Vegas Valley, $500K–$1.5M range, represented by GoRealestate agents in Clark County, Nevada.`;

  const res = await fetch(VENICE_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       VENICE_MODEL,
      temperature: 0.72,
      max_tokens:  1500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt    },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Venice HTTP ${res.status}`);
  }

  return res.json();
}

// ── AI Agent: Select Top 3 Questions ─────────────────────────────────────────
async function selectTop3ByAgent(questions) {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey || apiKey === "your_venice_api_key_here") {
    console.warn("[Agent] Venice key not set — using volume order for top 3");
    return questions.slice(0, 3);
  }

  const questionList = questions
    .map((q, i) => `${i + 1}. "${q.keyword}" — ${q.volume}/mo searches, difficulty ${q.difficulty}/100`)
    .join("\n");

  const agentPrompt = `You are a real estate content strategist for GoRealestate, a buyer/seller agency in Las Vegas, Nevada (Clark County, $500K–$1.5M market).

Your job: select the 3 questions that will deliver the most value as published articles this week.

Selection criteria (ranked by importance):
1. HIGH PURCHASE INTENT — the person asking is likely about to buy, sell, or make a financial decision
2. LOCAL EXPERTISE ADVANTAGE — a Las Vegas agent has unique insight that generic content can't provide
3. SEARCH VOLUME + SEO OPPORTUNITY — meaningful traffic potential
4. TIMELINESS — relevant to what buyers and sellers in Las Vegas are thinking about right now

Questions to evaluate:
${questionList}

Respond with ONLY a JSON array of 3 integers (question numbers, most important first). No explanation.
Example: [3, 7, 1]`;

  try {
    const res = await fetch(VENICE_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       VENICE_MODEL,
        temperature: 0.2,
        max_tokens:  40,
        messages: [
          { role: "system", content: "Output only valid JSON arrays. No text, no markdown, no explanation." },
          { role: "user",   content: agentPrompt },
        ],
      }),
    });

    const data    = await res.json();
    const raw     = data.choices?.[0]?.message?.content?.trim() ?? "[]";
    const cleaned = raw.replace(/```[a-z]*|```/gi, "").trim();
    const indices = JSON.parse(cleaned);

    if (!Array.isArray(indices) || indices.length < 1) throw new Error("invalid agent response");

    const top3 = indices
      .slice(0, 3)
      .map((n) => questions[Number(n) - 1])
      .filter(Boolean);

    if (top3.length === 0) throw new Error("no valid indices");

    console.log(`[Agent] ✓ Top 3 selected:\n  ${top3.map((q, i) => `${i + 1}. ${q.keyword}`).join("\n  ")}`);
    return top3;
  } catch (e) {
    console.warn("[Agent] Selection failed, falling back to volume order:", e.message);
    return questions.slice(0, 3);
  }
}

// ── Auto-generate articles for the AI-selected top 3 ─────────────────────────
async function autoGenerateTop3() {
  const week      = getISOWeek();
  const history   = readJSON(HISTORY_FILE, {});
  const questions = history[week]?.questions ?? getSeedQuestions();

  console.log("[AutoGen] Running AI agent to select top 3 questions…");
  const top3 = await selectTop3ByAgent(questions);

  // Persist the agent's selection
  const h = readJSON(HISTORY_FILE, {});
  if (h[week]) { h[week].top3 = top3; writeJSON(HISTORY_FILE, pruneHistory(h)); }

  const results = [];
  for (let i = 0; i < top3.length; i++) {
    const q = top3[i];
    console.log(`[AutoGen] ${i + 1}/3 — "${q.keyword}"`);

    const articles = readJSON(ARTICLES_FILE, []);
    const existing = articles.find((a) => a.keyword.toLowerCase() === q.keyword.toLowerCase());
    if (existing) {
      console.log(`[AutoGen]     Skipped — article already exists`);
      results.push({ skipped: true, article: existing });
      continue;
    }

    try {
      const veniceRes = await synthesizeArticle(q.keyword, q);
      const content   = veniceRes.choices?.[0]?.message?.content ?? "";
      const tokens    = veniceRes.usage?.total_tokens ?? 0;
      if (!content) throw new Error("empty Venice response");

      const article = {
        id:          randomUUID(),
        keyword:     q.keyword,
        content,
        tokens,
        volume:      q.volume ?? 0,
        difficulty:  q.difficulty ?? 0,
        isTop3:      true,
        generatedAt: new Date().toISOString(),
      };

      const arr = readJSON(ARTICLES_FILE, []);
      arr.unshift(article);
      writeJSON(ARTICLES_FILE, arr.slice(0, 500));

      const hNow = readJSON(HISTORY_FILE, {});
      if (hNow[week]) {
        hNow[week].articlesGenerated = (hNow[week].articlesGenerated ?? 0) + 1;
        writeJSON(HISTORY_FILE, hNow);
      }

      console.log(`[AutoGen]     ✓ ${tokens} tokens`);
      results.push({ article });
    } catch (e) {
      console.error(`[AutoGen]     ✗ ${e.message}`);
      results.push({ error: e.message, keyword: q.keyword });
    }
  }

  return { top3, results };
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/api/health", (_, res) => {
  const history  = readJSON(HISTORY_FILE, {});
  const articles = readJSON(ARTICLES_FILE, []);
  res.json({
    status:               "ok",
    semrushConfigured:    !!(process.env.SEMRUSH_API_KEY && process.env.SEMRUSH_API_KEY !== "your_semrush_api_key_here"),
    veniceConfigured:     !!(process.env.VENICE_API_KEY  && process.env.VENICE_API_KEY  !== "your_venice_api_key_here"),
    weeklyQuestionsWeeks: Object.keys(history).length,
    totalArticles:        articles.length,
    currentWeek:          getISOWeek(),
  });
});

app.get("/api/questions/weekly", async (_, res) => {
  const week    = getISOWeek();
  const history = readJSON(HISTORY_FILE, {});

  if (history[week]) {
    return res.json({ week, questions: history[week].questions });
  }

  try {
    const result = await runWeeklyPull();
    res.json(result);
  } catch (e) {
    console.error("[/api/questions/weekly]", e.message);
    res.json({ week, questions: getSeedQuestions() });
  }
});

app.get("/api/questions/history", (_, res) => {
  res.json(readJSON(HISTORY_FILE, {}));
});

app.post("/api/questions/refresh", async (_, res) => {
  try {
    const result = await runWeeklyPull();
    res.json(result);
  } catch (e) {
    console.error("[/api/questions/refresh]", e.message);
    res.status(502).json({ error: e.message });
  }
});

// POST /api/questions/import — write SEMrush data pulled via MCP connector
// Body: { questions: [{keyword, volume, difficulty}], week?: string }
app.post("/api/questions/import", (req, res) => {
  const { questions, week: reqWeek } = req.body ?? {};
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "questions array required" });
  }

  const week    = reqWeek ?? getISOWeek();
  const history = readJSON(HISTORY_FILE, {});

  history[week] = {
    fetchedAt:         new Date().toISOString(),
    source:            "semrush-mcp",
    questions:         questions.slice(0, 10),
    articlesGenerated: history[week]?.articlesGenerated ?? 0,
    top3:              history[week]?.top3 ?? [],
  };

  writeJSON(HISTORY_FILE, pruneHistory(history));
  console.log(`[Import] ✓ ${questions.length} MCP questions stored for ${week}`);
  res.json({ week, imported: questions.length });
});

app.post("/api/synthesize", async (req, res) => {
  const { prompt: keyword, context } = req.body ?? {};
  if (!keyword) return res.status(400).json({ error: "prompt required" });

  try {
    const veniceRes = await synthesizeArticle(keyword, context);
    const content   = veniceRes.choices?.[0]?.message?.content ?? "";
    const tokens    = veniceRes.usage?.total_tokens ?? 0;

    if (!content) return res.status(502).json({ error: "empty response from Venice" });

    const article = {
      id:          randomUUID(),
      keyword,
      content,
      tokens,
      volume:      context?.volume     ?? 0,
      difficulty:  context?.difficulty ?? 0,
      isTop3:      false,
      generatedAt: new Date().toISOString(),
    };

    const articles = readJSON(ARTICLES_FILE, []);
    articles.unshift(article);
    writeJSON(ARTICLES_FILE, articles.slice(0, 500));

    const week    = getISOWeek();
    const history = readJSON(HISTORY_FILE, {});
    if (history[week]) {
      history[week].articlesGenerated = (history[week].articlesGenerated ?? 0) + 1;
      writeJSON(HISTORY_FILE, history);
    }

    console.log(`[Venice] ✓ "${keyword.slice(0, 50)}" — ${tokens} tokens`);
    res.json({ article });
  } catch (e) {
    console.error("[/api/synthesize]", e.message);
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/articles", (_, res) => {
  res.json(readJSON(ARTICLES_FILE, []));
});

// GET /api/top3 — this week's AI-selected top 3 + their articles
app.get("/api/top3", (_, res) => {
  const week      = getISOWeek();
  const history   = readJSON(HISTORY_FILE, {});
  const articles  = readJSON(ARTICLES_FILE, []);
  const top3Qs    = history[week]?.top3 ?? [];

  const top3 = top3Qs.map((q) => ({
    question: q,
    article:  articles.find((a) => a.keyword.toLowerCase() === q.keyword.toLowerCase()) ?? null,
  }));

  res.json({ week, top3 });
});

// POST /api/auto-generate — AI agent selects top 3, generates all 3 articles
app.post("/api/auto-generate", async (_, res) => {
  try {
    const result = await autoGenerateTop3();
    res.json(result);
  } catch (e) {
    console.error("[/api/auto-generate]", e.message);
    res.status(502).json({ error: e.message });
  }
});

// ── Serve built React app in production ──────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const dist = join(__dirname, "../dist");
  app.use(express.static(dist));
  app.get(/.*/, (_, res) => res.sendFile(join(dist, "index.html")));
}

// Legacy
app.post("/api/research", async (req, res) => {
  const { phrase } = req.body ?? {};
  if (!phrase) return res.status(400).json({ error: "phrase required" });
  try {
    const apiKey = process.env.SEMRUSH_API_KEY;
    if (!apiKey || apiKey === "your_semrush_api_key_here") {
      return res.json({ data: getSeedQuestions() });
    }
    const questions = await fetchSEMrushQuestions(phrase, apiKey);
    res.json({ data: questions });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── Weekly Cron: every Monday 6:00 AM ────────────────────────────────────────
cron.schedule("0 6 * * 1", async () => {
  console.log("[Cron] Starting weekly pipeline…");
  try {
    await runWeeklyPull();
    await autoGenerateTop3();
    console.log("[Cron] ✓ Weekly pipeline complete");
  } catch (e) {
    console.error("[Cron] Pipeline error:", e.message);
  }
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
{
  const week    = getISOWeek();
  const history = readJSON(HISTORY_FILE, {});
  if (!history[week]) {
    console.log("[Bootstrap] No data for current week — seeding…");
    runWeeklyPull().catch((e) => {
      console.warn("[Bootstrap] Pull failed, using seed:", e.message);
      const h = readJSON(HISTORY_FILE, {});
      h[week] = {
        fetchedAt:         new Date().toISOString(),
        questions:         getSeedQuestions(),
        articlesGenerated: 0,
        top3:              [],
      };
      writeJSON(HISTORY_FILE, h);
    });
  }
}

app.listen(PORT, () => {
  const history = readJSON(HISTORY_FILE, {});
  const week    = getISOWeek();
  const source  = history[week]?.source === "semrush-mcp" ? "✓ MCP connector" : "seed data";
  console.log(`\n  GoRealestate API  →  http://localhost:${PORT}`);
  console.log(`  Data directory    →  ${DATA}`);
  console.log(`  Weekly cron       →  Every Monday 6:00 AM`);
  console.log(`  Venice model      →  ${VENICE_MODEL}`);
  console.log(`  SEMrush source    →  ${source} (${week})`);
  console.log(`  Venice key        →  ${process.env.VENICE_API_KEY === "your_venice_api_key_here" ? "NOT SET" : "✓ configured"}\n`);
});
