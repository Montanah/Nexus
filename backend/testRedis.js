require("dotenv").config();
const { Redis } = require("@upstash/redis");

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_URL,   
  token: process.env.UPSTASH_REDIS_TOKEN, 
});

async function testRedis() {
  try {
    console.log("✅ Connected to Upstash Redis");

    // Set a test key
    await redisClient.set("testKey", "Hello Redis");

    // Retrieve the test key
    const value = await redisClient.get("testKey");
    console.log("🔹 Retrieved from Redis:", value);

    // Cleanup: Delete the test key
    await redisClient.del("testKey");

    console.log("🚀 Redis test completed successfully");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
}

testRedis();
