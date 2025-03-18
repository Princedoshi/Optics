//redis-client.js

// redis-client.js
const { createClient } = require("redis");
require("dotenv").config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
  },
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis client connected successfully");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
};

module.exports = { redisClient, connectRedis };
