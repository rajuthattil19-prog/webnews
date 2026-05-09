require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ensureDb, ensureRedis } = require("./lib/db");
const { summarizeNews } = require("./lib/ai");
const axios = require("axios");
const cheerio = require("cheerio");
const Parser = require("rss-parser");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const rssParser = new Parser();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapSentiment(pct) {
  const p = pct || 0;
  if (p > 5) return "Mooning";
  if (p > 1) return "Heating Up";
  if (p < -5) return "Bleeding";
  if (p < -1) return "Chilly";
  return "Steady";
}

// ─── 1. GET /api/news ────────────────────────────────────────────────────────
app.get("/api/news", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page === 1) {
      const redis = await ensureRedis();
      const cached = await redis.get("latest_news");
      if (cached) return res.json({ source: "redis", data: JSON.parse(cached) });
    }

    const db = await ensureDb();
    const skip = (page - 1) * limit;
    const news = await db
      .collection("news")
      .find()
      .sort({ published_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({ source: "mongodb", data: news });
  } catch (err) {
    console.error("GET /api/news:", err.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ─── 2. GET /api/prices ──────────────────────────────────────────────────────
app.get("/api/prices", async (req, res) => {
  try {
    const redis = await ensureRedis();
    const cached = await redis.get("market_prices");
    if (cached) return res.json({ source: "redis", data: JSON.parse(cached) });
    res.json({ source: "redis", data: [] });
  } catch (err) {
    console.error("GET /api/prices:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// ─── 3. GET /api/search ──────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ data: [] });

    const db = await ensureDb();
    const regex = new RegExp(q, "i");
    const news = await db
      .collection("news")
      .find({
        $or: [
          { headline: { $regex: regex } },
          { ai_summary: { $regex: regex } },
          { related_symbols: { $regex: regex } },
        ],
      })
      .limit(20)
      .toArray();

    res.json({ source: "mongodb", data: news });
  } catch (err) {
    console.error("GET /api/search:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ─── Coin list ────────────────────────────────────────────────────────────────
const COIN_LIST = [
  "bitcoin", "ethereum", "tether", "binancecoin", "solana", "ripple",
  "usd-coin", "staked-ether", "dogecoin", "cardano", "tron", "shiba-inu",
  "avalanche-2", "chainlink", "bitcoin-cash", "polkadot", "near", "litecoin",
  "uniswap", "dai", "wrapped-bitcoin", "matic-network", "internet-computer",
  "ethereum-classic", "hedera-hashgraph", "stellar", "cosmos", "monero",
  "okb", "filecoin", "lido-dao", "arbitrum", "optimism", "aptos", "vechain",
  "aave", "the-graph", "maker", "algorand", "render-token", "injective-protocol",
  "rocket-pool", "kaspa", "bonk", "sei-network", "celestia", "sui",
  "worldcoin-wld", "pyth-network",
];

// ─── 4. GET /api/prices/seed ─────────────────────────────────────────────────
// Call once to bulk-load all coins. 1 CoinGecko API call → Redis.
app.get("/api/prices/seed", async (req, res) => {
  try {
    const redis = await ensureRedis();

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        timeout: 9_000, // fail before Vercel 10s limit
        params: {
          vs_currency: "usd",
          ids: COIN_LIST.join(","),
          order: "market_cap_desc",
          per_page: 250,
          page: 1,
          sparkline: false,
        },
      }
    );

    const coins = response.data.map((c) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price_usd: c.current_price,
      price_change_24h_pct: c.price_change_percentage_24h,
      market_cap_usd: c.market_cap,
      volume_24h_usd: c.total_volume,
      high_24h: c.high_24h,
      low_24h: c.low_24h,
      circulating_supply: c.circulating_supply,
      image: c.image,
      ai_sentiment_summary: `${c.name} is trading at $${(c.current_price || 0).toLocaleString()} with a ${(c.price_change_percentage_24h || 0) >= 0 ? "+" : ""}${(c.price_change_percentage_24h || 0).toFixed(2)}% move in the last 24 hours.`,
      sentiment: mapSentiment(c.price_change_percentage_24h),
    }));

    await redis.set("market_prices", JSON.stringify(coins));
    await redis.set("price_cursor", "0");

    res.json({ success: true, message: `Seeded ${coins.length} coins to Redis.` });
  } catch (err) {
    console.error("GET /api/prices/seed:", err.message);
    res.status(500).json({ success: false, error: "Price seed failed", details: err.message });
  }
});

// ─── 5. GET /api/prices/update ───────────────────────────────────────────────
// Updates ONE coin per ping via rotating Redis cursor.
app.get("/api/prices/update", async (req, res) => {
  try {
    const redis = await ensureRedis();

    const cursorStr = await redis.get("price_cursor");
    const cursor = cursorStr ? parseInt(cursorStr) : 0;
    const coinId = COIN_LIST[cursor % COIN_LIST.length];
    const nextCursor = (cursor + 1) % COIN_LIST.length;

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}`,
      {
        timeout: 8_000,
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
        },
      }
    );

    const c = response.data;
    const md = c.market_data;
    const coinData = {
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price_usd: md.current_price.usd,
      price_change_24h_pct: md.price_change_percentage_24h,
      market_cap_usd: md.market_cap.usd,
      volume_24h_usd: md.total_volume.usd,
      high_24h: md.high_24h.usd,
      low_24h: md.low_24h.usd,
      circulating_supply: md.circulating_supply,
      image: c.image?.large,
      ai_sentiment_summary: `${c.name} is trading at $${md.current_price.usd.toLocaleString()} with a ${md.price_change_percentage_24h >= 0 ? "+" : ""}${(md.price_change_percentage_24h || 0).toFixed(2)}% move in the last 24 hours.`,
      sentiment: mapSentiment(md.price_change_percentage_24h),
    };

    // Merge into existing Redis array
    const cachedStr = await redis.get("market_prices");
    let allCoins = cachedStr ? JSON.parse(cachedStr) : [];
    const idx = allCoins.findIndex((x) => x.id === coinData.id);
    if (idx >= 0) allCoins[idx] = coinData;
    else allCoins.push(coinData);
    await redis.set("market_prices", JSON.stringify(allCoins));
    await redis.set("price_cursor", String(nextCursor));

    res.json({
      success: true,
      message: `Updated ${coinData.name} (${coinData.symbol}) — cursor ${cursor} -> ${nextCursor}`,
    });
  } catch (err) {
    console.error("GET /api/prices/update:", err.message);
    res.status(500).json({ success: false, error: "Price update failed", details: err.message });
  }
});

// ─── 6. GET /api/cron ────────────────────────────────────────────────────────
// State machine: Scout → Extractor → Editor
// Serverless-safe: processes only ONE item per stage per invocation.
// Keeps well under Vercel's 10s function timeout.
app.get("/api/cron", async (req, res) => {
  try {
    const redis = await ensureRedis();
    const db = await ensureDb();
    let actionLog = [];

    // Read state from Redis
    const extractedStr = await redis.get("extracted_texts");
    const extractedQueue = extractedStr ? JSON.parse(extractedStr) : [];
    const pendingStr = await redis.get("pending_links");
    const pendingLinks = pendingStr ? JSON.parse(pendingStr) : [];

    if (extractedQueue.length > 0) {
      // ── STAGE: Editor — process exactly 1 article through AI ──
      const article = extractedQueue.shift();
      try {
        console.log("AI summarising:", article.title);
        const aiResult = await summarizeNews(article.text);
        if (!aiResult) throw new Error("AI returned null");

        const finalNewsItem = {
          id: Date.now().toString(),
          headline: aiResult.headline || article.title,
          ai_summary: aiResult.ai_summary,
          source: "CoinTelegraph",
          published_at: new Date(article.pubDate || Date.now()).toISOString(),
          category: "News",
          read_minutes: Math.max(1, Math.ceil(article.text.length / 1000)),
          image_url: article.image_url,
          related_symbols: aiResult.related_symbols || [],
          sentiment: aiResult.sentiment || "Steady",
          link: article.link,
        };

        await db.collection("news").insertOne(finalNewsItem);

        // Keep latest_news Redis cache (top 10)
        const latestStr = await redis.get("latest_news");
        let latestNews = latestStr ? JSON.parse(latestStr) : [];
        latestNews.unshift(finalNewsItem);
        latestNews = latestNews.slice(0, 10);
        await redis.set("latest_news", JSON.stringify(latestNews));

        actionLog.push(`Editor: saved "${finalNewsItem.headline}". Queue remaining: ${extractedQueue.length}`);
      } catch (err) {
        console.error(`Editor failed for ${article.title}:`, err.message);
        actionLog.push(`Editor: failed for "${article.title}" — ${err.message}`);
      }
      await redis.set("extracted_texts", JSON.stringify(extractedQueue));

    } else if (pendingLinks.length > 0) {
      // ── STAGE: Extractor — scrape up to 3 articles in one call ──
      const BATCH = 3;
      let processed = 0;
      const fresh = [];

      while (pendingLinks.length > 0 && processed < BATCH) {
        const article = pendingLinks.shift();
        try {
          console.log("Scraping:", article.link);
          const resp = await axios.get(article.link, { timeout: 5_000 });
          const $ = cheerio.load(resp.data);
          const paragraphs = [];
          $("p").each((_, el) => paragraphs.push($(el).text()));
          const fullText = paragraphs.join("\n").substring(0, 4000);
          const imageUrl =
            $("meta[property='og:image']").attr("content") ||
            $("img").first().attr("src");

          fresh.push({
            title: article.title,
            link: article.link,
            pubDate: article.pubDate,
            text: fullText,
            image_url: imageUrl,
          });
          processed++;
        } catch (err) {
          console.error(`Extractor skipped ${article.link}:`, err.message);
        }
      }

      // Merge fresh into existing extracted queue
      const existingExtracted = (await redis.get("extracted_texts"));
      const existingQueue = existingExtracted ? JSON.parse(existingExtracted) : [];
      await redis.set("pending_links", JSON.stringify(pendingLinks));
      await redis.set("extracted_texts", JSON.stringify([...existingQueue, ...fresh]));
      actionLog.push(`Extractor: scraped ${processed} article(s). Pending remaining: ${pendingLinks.length}`);

    } else {
      // ── STAGE: Scout — read RSS and queue new links ──
      console.log("Scouting RSS...");
      const feed = await rssParser.parseURL("https://cointelegraph.com/rss");
      const existingPending = pendingLinks; // already parsed above

      let addedCount = 0;
      for (let i = 0; i < Math.min(feed.items.length, 10); i++) {
        const item = feed.items[i];
        if (existingPending.some((l) => l.link === item.link)) continue;
        const exists = await db.collection("news").findOne({ link: item.link });
        if (!exists) {
          existingPending.push({ title: item.title, link: item.link, pubDate: item.pubDate });
          addedCount++;
        }
      }
      await redis.set("pending_links", JSON.stringify(existingPending));
      actionLog.push(`Scout: found ${addedCount} new article(s). Total pending: ${existingPending.length}`);
    }

    res.json({ success: true, log: actionLog });
  } catch (err) {
    console.error("GET /api/cron:", err.message);
    res.status(500).json({ success: false, error: "Cron failed", details: err.message });
  }
});

// ─── 7. GET /api/health ──────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const db = await ensureDb();
    const redis = await ensureRedis();
    res.json({
      ok: true,
      mongo: !!db,
      redis: redis.isReady,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
// Locally: listen on PORT.
// On Vercel: just export the app — Vercel wraps it. No app.listen().
if (!process.env.VERCEL) {
  const start = async () => {
    await ensureDb();
    await ensureRedis();
    app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
  };
  start().catch((err) => {
    console.error("Startup error:", err);
    process.exit(1);
  });
}

// Required for Vercel serverless
module.exports = app;
