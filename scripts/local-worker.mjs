import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
const action = process.argv[2] || "up";
const envFile = ".env.variant-quick-order.development";
if (!existsSync(envFile)) throw new Error(`Missing ${envFile}.`);
const base = ["compose", "-f", "docker-compose.local.yaml"];
const env = { ...process.env, LOCAL_ENV_FILE: envFile };
const actions = {
  up: [...base, "up", "-d", "--build", "--wait", "postgres", "redis", "worker"],
  down: [...base, "down"],
  logs: [...base, "logs", "-f", "--tail", "100", "worker"],
  restart: [...base, "restart", "worker"],
  status: [...base, "ps"],
};
if (!actions[action])
  throw new Error("Usage: node scripts/local-worker.mjs [up|down|logs|restart|status]");
const child = spawn("docker", actions[action], { stdio: "inherit", env });
child.on("exit", (code) => process.exit(code ?? 0));
