export interface RuntimeIdentity {
  appHandle: string;
  environment: string;
}

export const QUEUE_NAME_SEPARATOR = "__";

export function requireEnvironmentVariable(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getRuntimeIdentity(env: NodeJS.ProcessEnv = process.env): RuntimeIdentity {
  return {
    appHandle: requireEnvironmentVariable("APP_HANDLE", env),
    environment: requireEnvironmentVariable("APP_ENV", env),
  };
}

function normalizeQueueSegment(value: string, label: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label} must be non-empty.`);
  }

  if (normalized.includes(":")) {
    throw new Error(
      `${label} cannot contain ":" because BullMQ queue names cannot contain colons.`,
    );
  }

  if (normalized.includes(QUEUE_NAME_SEPARATOR)) {
    throw new Error(
      `${label} cannot contain "${QUEUE_NAME_SEPARATOR}" because it is ` +
        "reserved as the queue boundary separator.",
    );
  }

  return normalized;
}

export function buildQueueName(identity: RuntimeIdentity, suffix: string): string {
  const appHandle = normalizeQueueSegment(identity.appHandle, "APP_HANDLE");
  const environment = normalizeQueueSegment(identity.environment, "APP_ENV");
  const queueSuffix = normalizeQueueSegment(suffix, "Queue suffix");

  return [appHandle, environment, queueSuffix].join(QUEUE_NAME_SEPARATOR);
}
