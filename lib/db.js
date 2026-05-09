require("dotenv").config();
const { MongoClient } = require("mongodb");
const { createClient } = require("redis");

// ─── MongoDB ────────────────────────────────────────────────────────────────
const mongoUri = process.env.MONGO_URI;
let _mongoClient = null;
let _db = null;

async function ensureDb() {
  if (_db) return _db; // already connected — reuse

  _mongoClient = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 8_000, // fail fast on cold start
    connectTimeoutMS: 8_000,
  });
  await _mongoClient.connect();
  _db = _mongoClient.db("ledger");

  // Background index — don't await, prevents blocking the request
  _db
    .collection("news")
    .createIndex({ headline: "text", ai_summary: "text" }, { background: true })
    .catch(() => {});

  console.log("✅ MongoDB Connected");
  return _db;
}

// ─── Redis ───────────────────────────────────────────────────────────────────
// REDIS_HOST already contains host:port (e.g. redis-15462.c15.us-east-1-2.ec2.cloud.redislabs.com:15462)
const redisUrl = `redis://default:${process.env.REDIS_PASS}@${process.env.REDIS_HOST}`;
let _redisClient = null;

async function ensureRedis() {
  if (_redisClient && _redisClient.isReady) return _redisClient; // reuse

  _redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 500, 5_000),
      connectTimeout: 8_000,
      keepAlive: 5_000,
    },
  });

  _redisClient.on("error", (err) =>
    console.error("Redis Error:", err.code || err.message)
  );

  await _redisClient.connect();
  console.log("✅ Redis Connected");
  return _redisClient;
}

module.exports = { ensureDb, ensureRedis };
