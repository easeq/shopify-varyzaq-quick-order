import type { Worker } from "bullmq";

export function parseWorkerRoles<Role extends string>(params: {
  availableRoles: readonly Role[];
  value?: string;
}): Role[] {
  const { availableRoles, value } = params;

  if (!value || value.trim().toLowerCase() === "all") {
    return [...availableRoles];
  }

  const requestedRoles = value
    .split(",")
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);

  const invalidRoles = requestedRoles.filter(
    (role) => !(availableRoles as readonly string[]).includes(role),
  );

  if (invalidRoles.length > 0) {
    throw new Error(
      `Unknown worker role(s): ${invalidRoles.join(", ")}. ` +
        `Expected ${availableRoles.join(", ")}, or all.`,
    );
  }

  return Array.from(new Set(requestedRoles)) as Role[];
}

export async function waitForWorkersReady(params: {
  workers: readonly Worker[];
  timeoutMs?: number;
}): Promise<void> {
  const timeoutMs = params.timeoutMs ?? 30_000;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Worker ready timeout must be a positive number.");
  }

  let timeout: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      Promise.all(params.workers.map((worker) => worker.waitUntilReady())),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`BullMQ workers did not become ready within ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    await Promise.allSettled(params.workers.map((worker) => worker.close()));
    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export function installWorkerShutdown(params: {
  workers: readonly Worker[];
  exit?: (code: number) => never;
}): () => Promise<void> {
  const exit = params.exit ?? ((code: number) => process.exit(code));

  const shutdown = async (): Promise<void> => {
    await Promise.all(params.workers.map((worker) => worker.close()));
  };

  process.once("SIGTERM", () => {
    void shutdown().finally(() => exit(0));
  });
  process.once("SIGINT", () => {
    void shutdown().finally(() => exit(0));
  });

  return shutdown;
}
