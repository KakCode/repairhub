import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { autoApproveOverdueShops } from "@/lib/shopApproval";
import AdminShopActions from "@/components/AdminShopActions";
import AdminShopApprovalActions from "@/components/AdminShopApprovalActions";

export default async function AdminShopsPage() {
  await autoApproveOverdueShops();

  const shops = await prisma.shop.findMany({
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  });

  const pendingShops = shops.filter((shop) => shop.approvalStatus === "PENDING");
  const otherShops = shops.filter((shop) => shop.approvalStatus !== "PENDING");

  return (
    <div className="flex flex-col gap-10">
      {pendingShops.length > 0 && (
        <div>
          <h2 className="mb-1 text-lg font-semibold">Pending approval ({pendingShops.length})</h2>
          <p className="mb-4 text-sm text-zinc-500">
            New shops aren&apos;t visible in search until approved. No automated photo moderation is
            wired in yet, so every shop here needs a manual look.
          </p>
          <ul className="flex flex-col gap-3">
            {pendingShops.map((shop) => (
              <li
                key={shop.id}
                className="card flex flex-col items-start justify-between gap-3 border-orange-200 p-4 dark:border-orange-900 sm:flex-row sm:items-center"
              >
                <div>
                  <Link href={`/shops/${shop.id}`} className="font-medium hover:text-orange-600">
                    {shop.name}
                  </Link>
                  <p className="text-sm text-zinc-500">{shop.categories.join(" · ")}</p>
                  <p className="text-xs text-zinc-400">
                    Owner: {shop.owner.name} ({shop.owner.email})
                  </p>
                  {shop.approvalDeadline && (
                    <p className="text-xs text-orange-600">
                      Decision expected by {shop.approvalDeadline.toLocaleString()}
                    </p>
                  )}
                </div>
                <AdminShopApprovalActions shopId={shop.id} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">All shops ({otherShops.length})</h2>
        <ul className="flex flex-col gap-3">
          {otherShops.map((shop) => (
            <li
              key={shop.id}
              className="card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/shops/${shop.id}`} className="font-medium hover:text-orange-600">
                    {shop.name}
                  </Link>
                  {shop.isVerified && <span className="badge-open">Verified</span>}
                  {shop.approvalStatus === "REJECTED" && (
                    <span className="badge-declined">Rejected</span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">{shop.categories.join(" · ")}</p>
                <p className="text-xs text-zinc-400">
                  Owner: {shop.owner.name} ({shop.owner.email})
                </p>
              </div>
              <AdminShopActions shopId={shop.id} isVerified={shop.isVerified} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
