import { prisma } from "@/lib/prisma";

/**
 * No background job/cron exists in this app, so the "decision within 24h" SLA
 * can't be enforced by a real scheduler. As a pragmatic fallback, any shop
 * still PENDING past its deadline is lazily flipped to APPROVED here — called
 * from the pages that list shops, so it's a no-op almost all the time.
 */
export async function autoApproveOverdueShops(): Promise<void> {
  await prisma.shop.updateMany({
    where: { approvalStatus: "PENDING", approvalDeadline: { lt: new Date() } },
    data: { approvalStatus: "APPROVED" },
  });
}
