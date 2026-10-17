export interface DatabaseBoundaryResult {
  databaseName: string;
  expectedDatabaseName: string;
}

/**
 * Enforces the repository convention that each app/environment owns a complete
 * PostgreSQL database. Schema multiplexing is intentionally rejected.
 */
export function assertPostgresDatabaseBoundary(params: {
  databaseUrl: string;
  expectedDatabaseName: string;
}): DatabaseBoundaryResult {
  let url: URL;

  try {
    url = new URL(params.databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use the postgresql:// or postgres:// protocol.");
  }

  if (url.searchParams.has("schema")) {
    throw new Error(
      "DATABASE_URL must not use ?schema=. Each app/environment requires its own database.",
    );
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  const expectedDatabaseName = params.expectedDatabaseName.trim();

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  if (!expectedDatabaseName) {
    throw new Error("An expected database name is required for boundary validation.");
  }

  if (databaseName !== expectedDatabaseName) {
    throw new Error(
      `Database isolation violation: expected "${expectedDatabaseName}" but ` +
        `DATABASE_URL targets "${databaseName}".`,
    );
  }

  return {
    databaseName,
    expectedDatabaseName,
  };
}
