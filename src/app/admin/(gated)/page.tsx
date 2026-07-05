import { prisma } from "@/lib/prisma";
import { autoApproveOverdueShops } from "@/lib/shopApproval";

export default async function AdminOverviewPage() {
  await autoApproveOverdueShops();

  const [
    totalShops,
    verifiedShops,
    pendingShopApprovals,
    totalCustomers,
    totalShopOwners,
    totalBookings,
    pendingBookings,
    totalReviews,
    pendingReviews,
    totalCategories,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { isVerified: true } }),
    prisma.shop.count({ where: { approvalStatus: "PENDING" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "SHOP_OWNER" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.review.count(),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.category.count(),
  ]);

  const stats = [
    { label: "Shops", value: totalShops, hint: `${verifiedShops} verified` },
    { label: "Pending shop approvals", value: pendingShopApprovals },
    { label: "Customers", value: totalCustomers },
    { label: "Shop owners", value: totalShopOwners },
    { label: "Bookings", value: totalBookings, hint: `${pendingBookings} pending` },
    { label: "Reviews", value: totalReviews, hint: `${pendingReviews} pending` },
    { label: "Categories", value: totalCategories },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Overview</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{stat.value}</p>
            {stat.hint && <p className="mt-1 text-xs text-zinc-400">{stat.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
