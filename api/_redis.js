import { Redis } from "@upstash/redis";
export const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL/TOKEN
