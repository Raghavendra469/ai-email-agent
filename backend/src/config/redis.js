import "dotenv/config";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("Missing REDIS_URL environment variable. Make sure backend/.env is loaded before startup.");
}

export const redisConnection = new Redis(
  redisUrl,
  {
    maxRetriesPerRequest: null,
  }
);