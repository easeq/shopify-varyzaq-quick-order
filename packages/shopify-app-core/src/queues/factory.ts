import { Queue, Worker, type JobsOptions, type Processor } from "bullmq";
import { createRedisConnection } from "./redis.ts";

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 5_000,
  },
  removeOnComplete: {
    age: 60 * 60,
    count: 500,
  },
  removeOnFail: {
    age: 24 * 60 * 60,
    count: 1_000,
  },
};

function assertBullMqQueueName(name: string): void {
  if (!name.trim()) {
    throw new Error("BullMQ queue name must be non-empty.");
  }

  if (name.includes(":")) {
    throw new Error(
      `BullMQ queue name "${name}" is invalid because queue names cannot contain colons.`,
    );
  }
}

export function createAppQueue(params: {
  name: string;
  redisUrl: string;
  defaultJobOptions?: JobsOptions;
}): Queue {
  assertBullMqQueueName(params.name);

  const queue = new Queue(params.name, {
    connection: createRedisConnection(params.redisUrl),
    defaultJobOptions: params.defaultJobOptions ?? DEFAULT_JOB_OPTIONS,
  });

  queue.on("error", (error) => {
    console.error(`[BullMQ:${params.name}] Queue error`, error);
  });

  return queue;
}

export function createAppWorker(params: {
  name: string;
  redisUrl: string;
  processor: Processor;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}): Worker {
  assertBullMqQueueName(params.name);

  const worker = new Worker(params.name, params.processor, {
    connection: createRedisConnection(params.redisUrl),
    concurrency: params.concurrency ?? 4,
    limiter: params.limiter,
  });

  worker.on("failed", (job, error) => {
    console.error(`[BullMQ:${params.name}] ${job?.id} failed`, error);
  });

  worker.on("error", (error) => {
    console.error(`[BullMQ:${params.name}] Worker error`, error);
  });

  return worker;
}
