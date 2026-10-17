import type { Queue } from "bullmq";

export async function upsertCronJob(params: {
  queue: Queue;
  schedulerId: string;
  pattern: string;
  jobName: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await params.queue.upsertJobScheduler(
    params.schedulerId,
    { pattern: params.pattern },
    {
      name: params.jobName,
      data: params.data ?? {},
    },
  );
}
