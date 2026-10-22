import prisma from "../../db.server";
import { syncSubscriptionFromShopify } from "../../services/billing.server";
import { unauthenticated } from "../../shopify.server";
import { getSubscriptionQueue, JOB_TYPES } from "../queue.server";
const HOURS = Math.max(1, Number(process.env.SUBSCRIPTION_SYNC_MAX_AGE_HOURS ?? 24));
const STALE = HOURS * 60 * 60 * 1000;
export async function processSubscriptionCheck() {
  const rows = await prisma.subscription.findMany({
    where: {
      OR: [{ updatedAtShopify: null }, { updatedAtShopify: { lt: new Date(Date.now() - STALE) } }],
    },
    select: { shop: true },
    take: 500,
  });
  if (!rows.length) return;
  await getSubscriptionQueue().addBulk(
    rows.map(({ shop }) => ({
      name: JOB_TYPES.SUBSCRIPTION_CHECK_FOR_SHOP,
      data: { shop },
      opts: { removeOnComplete: true },
    })),
  );
}
export async function processSingleShopSubscription({ shop }: { shop: string }) {
  const current = await prisma.subscription.findUnique({ where: { shop } });
  if (current?.updatedAtShopify && current.updatedAtShopify > new Date(Date.now() - STALE)) return;
  const { session } = await unauthenticated.admin(shop);
  if (!session.accessToken) throw new Error(`Offline access token is missing for ${shop}.`);
  await syncSubscriptionFromShopify({ shop, adminAccessToken: session.accessToken });
}
