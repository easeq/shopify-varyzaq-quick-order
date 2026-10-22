import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { loadEnvFile } from "node:process";

const envFile = ".env.variant-quick-order.development";
if (!existsSync(envFile)) throw new Error(`Missing ${envFile}.`);
loadEnvFile(envFile);
const env = {
  ...process.env,
  APP_ENV: "development",
  WORKER_ROLES: process.env.WORKER_ROLES || "all",
};
if (!env.SHOPIFY_DEV_STORE) throw new Error("SHOPIFY_DEV_STORE is required.");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const shopify = spawn(
  pnpm,
  [
    "exec",
    "shopify",
    "app",
    "dev",
    "--config=variant-quick-order-development",
    `--store=${env.SHOPIFY_DEV_STORE}`,
  ],
  { stdio: "inherit", env },
);
const worker = spawn(pnpm, ["exec", "tsx", "worker.ts"], { stdio: "inherit", env });
let closing = false;
function close(signal = "SIGTERM") {
  if (closing) return;
  closing = true;
  if (!shopify.killed) shopify.kill(signal);
  if (!worker.killed) worker.kill(signal);
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    close(signal);
    process.exitCode = 0;
  });
shopify.on("exit", (code, signal) => {
  close(signal || "SIGTERM");
  process.exitCode = code ?? 1;
});
worker.on("exit", (code, signal) => {
  close(signal || "SIGTERM");
  process.exitCode = code ?? 1;
});
