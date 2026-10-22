import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
const environment = process.env.APP_ENV || process.argv[2];
if (!["development", "staging", "production"].includes(environment))
  throw new Error("APP_ENV (or first argument) must be development, staging, or production.");
if (environment === "production" && process.env.ALLOW_PRODUCTION_DEPLOY !== "yes")
  throw new Error(
    "Production deploy blocked. Set ALLOW_PRODUCTION_DEPLOY=yes after change review.",
  );
const configName = `variant-quick-order-${environment}`;
const file = `shopify.app.${configName}.toml`;
if (!existsSync(file)) throw new Error(`Missing ${file}.`);
const checks = [
  ["pnpm", ["lint:configs"]],
  ["pnpm", ["test:all"]],
  ["pnpm", ["typecheck"]],
  ["pnpm", ["build"]],
];
for (const [command, args] of checks) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
const result = spawnSync(
  "pnpm",
  ["exec", "shopify", "app", "deploy", `--config=${configName}`, "--allow-updates"],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(result.status || 0);
