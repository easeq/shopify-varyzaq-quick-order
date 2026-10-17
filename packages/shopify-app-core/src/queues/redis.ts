import IORedis from "ioredis";

function assertRedisUrl(redisUrl: string): void {
  let url: URL;

  try {
    url = new URL(redisUrl);
  } catch {
    throw new Error("REDIS_URL must be a valid Redis URL.");
  }

  if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
    throw new Error("REDIS_URL must use the redis:// or rediss:// protocol.");
  }
}

export function createRedisConnection(redisUrl: string): IORedis {
  assertRedisUrl(redisUrl);

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on("error", (error) => {
    console.error("[Redis] Connection error:", error.message);
  });

  return connection;
}
