import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateShopAction } from "@/actions/shop";
import ShopForm from "@/components/ShopForm";
import PhotoManager from "@/components/PhotoManager";
import LogoManager from "@/components/LogoManager";
import type { OpeningHours } from "@/lib/validations";

export default async function DashboardProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const session = await auth();
  const [shop, categories] = await Promise.all([
    prisma.shop.findUnique({
      where: { ownerId: session!.user.id },
      include: { photos: true, services: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!shop) return null;

  const boundUpdate = updateShopAction.bind(null, shop.id);

  return (
    <div className="flex flex-col gap-10">
      {shop.approvalStatus === "PENDING" && (
        <div className="card border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          ⏳ {welcome ? "Your shop is registered! " : ""}It&apos;s pending admin approval and won&apos;t
          appear in search yet — usually decided within 24 hours.
        </div>
      )}
      {shop.approvalStatus === "REJECTED" && (
        <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          ❌ This shop was rejected by an admin and isn&apos;t visible in search.
        </div>
      )}
      {welcome && shop.approvalStatus === "APPROVED" && !shop.logoUrl && shop.photos.length === 0 && (
        <div className="card border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          🎉 Your shop is live! Add a profile photo below so customers recognize you.
        </div>
      )}

      <div>
        <h2 className="mb-1 text-lg font-semibold">Shop profile photo</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Your main photo — shown on search results, the map, and at the top of your shop page.
        </p>
        <div className="card p-6">
          <LogoManager shopId={shop.id} logoUrl={shop.logoUrl} />
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold">Photos</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Extra photos of your shop, work, and equipment — shown as a gallery on your shop page.
        </p>
        <div className="card p-6">
          <PhotoManager shopId={shop.id} photos={shop.photos} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Shop details</h2>
        <ShopForm
          action={boundUpdate}
          submitLabel="Save changes"
          availableCategories={categories.map((c) => c.name)}
          defaultValues={{
            name: shop.name,
            description: shop.description,
            categories: shop.categories,
            address: shop.address,
            latitude: shop.latitude,
            longitude: shop.longitude,
            phone: shop.phone,
            whatsapp: shop.whatsapp,
            email: shop.email,
            website: shop.website,
            yearsExperience: shop.yearsExperience,
            certifications: shop.certifications,
            openingHours: (shop.openingHours as OpeningHours | null) ?? undefined,
            services: shop.services.map((s) => ({
              name: s.name,
              priceFrom: s.priceFrom ?? undefined,
            })),
          }}
        />
      </div>
    </div>
  );
}
