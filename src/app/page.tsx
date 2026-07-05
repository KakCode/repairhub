import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOpenNow } from "@/lib/openingHours";
import { autoApproveOverdueShops } from "@/lib/shopApproval";
import ShopExplorer, { type ExplorerShop } from "@/components/ShopExplorer";

export default async function Home() {
  const session = await auth();
  await autoApproveOverdueShops();
  const [shops, categories] = await Promise.all([
    prisma.shop.findMany({
      where: { approvalStatus: "APPROVED" },
      include: { photos: true, reviews: { where: { status: "APPROVED" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const explorerShops: ExplorerShop[] = shops.map((shop) => {
    const reviewCount = shop.reviews.length;
    const rating = reviewCount
      ? shop.reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewCount
      : null;

    return {
      id: shop.id,
      name: shop.name,
      categories: shop.categories,
      address: shop.address,
      latitude: shop.latitude,
      longitude: shop.longitude,
      photoUrl: shop.logoUrl ?? shop.photos[0]?.url ?? undefined,
      rating,
      reviewCount,
      isOpenNow: isOpenNow(shop.openingHours),
      isVerified: shop.isVerified,
    };
  });

  return (
    <div className="flex-1">
      <div className="relative overflow-hidden border-b border-[var(--border)]">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 100% at 15% 0%, var(--accent-soft), transparent), radial-gradient(50% 80% at 100% 0%, var(--accent-soft), transparent)",
          }}
        />
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:pb-14 sm:pt-20">
          <span className="badge-open mb-4">🎉 Free forever for repair shops</span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Find a repair shop <span className="text-orange-600">near you</span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-zinc-500">
            Motorcycles, bikes, cars, tractors, and more — search, compare, and book a repair in minutes.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <ShopExplorer
          shops={explorerShops}
          categories={categories.map((c) => c.name)}
          isLoggedIn={!!session?.user}
        />
      </div>
    </div>
  );
}
