import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { loadEnvFile } from "node:process";

const envFile = ".env.variant-quick-order.development";
const configName = "variant-quick-order-development";
const configFile = `shopify.app.${configName}.toml`;
if (!existsSync(envFile)) {
  console.error(
    `Missing ${envFile}. Copy ${envFile}.example and fill in the development credentials.`,
  );
  process.exit(1);
}
loadEnvFile(envFile);
const required = [
  "APP_HANDLE",
  "DATABASE_URL",
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_DEV_STORE",
];
for (const name of required) {
  if (!process.env[name]?.trim()) throw new Error(`${name} is required in ${envFile}.`);
}
const databaseName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, "");
if (databaseName !== "variant_quick_order_development") {
  throw new Error(
    `${envFile} must target PostgreSQL database variant_quick_order_development; got ${databaseName}.`,
  );
}
const source = await readFile(configFile, "utf8");
const clientId = source.match(/^client_id\s*=\s*"([^"]+)"/m)?.[1] || "";
if (!clientId || clientId.startsWith("REPLACE_WITH_")) {
  throw new Error(
    `${configFile} is not linked to a Shopify development app. Run shopify app config link --config ${configName}.`,
  );
}
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(
  command,
  [
    "exec",
    "shopify",
    "app",
    "dev",
    `--config=${configName}`,
    `--store=${process.env.SHOPIFY_DEV_STORE}`,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, APP_ENV: "development" },
  },
);
child.on("exit", (code) => process.exit(code ?? 0));
