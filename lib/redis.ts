import { Redis } from "@upstash/redis";

// 환경변수가 없으면 빌드는 통과하되 런타임에서 명확한 에러 발생
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "UPSTASH_REDIS_REST_URL 및 UPSTASH_REDIS_REST_TOKEN 환경변수를 설정해 주세요.",
    );
  }
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});
