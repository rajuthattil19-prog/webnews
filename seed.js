require("dotenv").config();
const { ensureDb, ensureRedis } = require("./lib/db");
const axios = require("axios");
const Parser = require("rss-parser");
const rssParser = new Parser();

async function seed() {
  const db = await ensureDb();
  const redis = await ensureRedis();

  // ── Seed Prices ────────────────────────────────────────────────────────────
  console.log("Seeding Prices...");
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        timeout: 15_000,
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 50,
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
      sentiment:
        (c.price_change_percentage_24h || 0) > 5  ? "Mooning"    :
        (c.price_change_percentage_24h || 0) > 0  ? "Heating Up" :
        (c.price_change_percentage_24h || 0) > -2 ? "Steady"     :
        (c.price_change_percentage_24h || 0) > -5 ? "Chilly"     : "Bleeding",
      ai_sentiment_summary: `The market sentiment for ${c.name} is currently ${(c.price_change_percentage_24h || 0) > 0 ? "positive" : "negative"} with a 24h change of ${(c.price_change_percentage_24h || 0).toFixed(2)}%.`,
    }));

    await redis.set("market_prices", JSON.stringify(coins));
    await redis.set("price_cursor", "0");
    console.log(`✅ Seeded ${coins.length} coins to Redis.`);
  } catch (err) {
    console.error("❌ Failed to seed prices:", err.message);
  }

  // ── Seed News ─────────────────────────────────────────────────────────────
  console.log("Seeding News...");
  try {
    const feed = await rssParser.parseURL("https://cointelegraph.com/rss");

    const newsItems = [];
    for (let i = 0; i < Math.min(feed.items.length, 25); i++) {
      const item = feed.items[i];
      newsItems.push({
        id: `seed_${Date.now()}_${i}`,
        headline: item.title,
        ai_summary: item.contentSnippet
          ? item.contentSnippet.substring(0, 200) + "..."
          : "No summary available. Read the full article for more details.",
        source: "CoinTelegraph",
        published_at: new Date(item.pubDate || Date.now()).toISOString(),
        category: "Crypto News",
        read_minutes: Math.floor(Math.random() * 5) + 2,
        image_url:
          item.content?.match(/<img[^>]+src="([^">]+)"/)
            ? item.content.match(/<img[^>]+src="([^">]+)"/)[1]
            : `https://picsum.photos/seed/${i}/800/400`,
        related_symbols: ["BTC", "ETH"],
        sentiment: i % 2 === 0 ? "Heating Up" : "Steady",
        link: item.link,
      });
    }

    if (newsItems.length > 0) {
      await db.collection("news").deleteMany({});
      await db.collection("news").insertMany(newsItems);
      console.log(`✅ Seeded ${newsItems.length} news items to MongoDB.`);
      await redis.set("latest_news", JSON.stringify(newsItems.slice(0, 10)));
      console.log("✅ Seeded top 10 news to Redis.");
    }
  } catch (err) {
    console.error("❌ Failed to seed news:", err.message);
  }

  console.log("Seeding completed!");
  process.exit(0);
}

seed();
