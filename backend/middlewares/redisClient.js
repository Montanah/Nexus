require("dotenv").config();
const { Redis } = require("@upstash/redis");

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Ensure credentials are correctly loaded
if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  console.error("❌ Upstash Redis URL or Token is missing!");
  process.exit(1);
}

module.exports = redisClient;
