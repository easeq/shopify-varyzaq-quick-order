// The worker never serves HTTP or runs OAuth; it only uses stored offline
// tokens to call the Admin API. shopifyApp() still insists on a non-empty
// appUrl, and during local development `shopify app dev` injects the real URL
// only into the host (web) process, not into the Docker worker. A placeholder
// is therefore enough here and means one shared env file works for both.
process.env.SHOPIFY_APP_URL ||= "https://worker.invalid";

async function main() {
  const { parseWorkerRoles, startWorkers } = await import("./app/queues/bootstrap.server");
  const roles = parseWorkerRoles();
  console.log(`[BullMQ] Starting Variant Quick Order workers: ${roles.join(", ")}.`);
  await startWorkers(roles);
}
main().catch((error) => {
  console.error("[BullMQ] Worker bootstrap failed.", error);
  process.exit(1);
});
