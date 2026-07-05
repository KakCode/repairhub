import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOpenNow } from "@/lib/openingHours";
import { createReviewAction } from "@/actions/review";
import ReviewForm from "@/components/ReviewForm";
import StarRating from "@/components/StarRating";
import MapView from "@/components/MapView";
import type { OpeningHours } from "@/lib/validations";

const DAY_LABELS: { key: keyof OpeningHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export default async function ShopProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      photos: true,
      services: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shop) notFound();

  const isOwnerViewing = session?.user?.id === shop.ownerId;
  const isAdminViewing = session?.user?.role === "ADMIN";
  if (shop.approvalStatus !== "APPROVED" && !isOwnerViewing && !isAdminViewing) {
    notFound();
  }

  const reviewCount = shop.reviews.length;
  const avgRating = reviewCount
    ? shop.reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewCount
    : null;

  const reviewableBooking = session?.user
    ? await prisma.booking.findFirst({
        where: {
          shopId: shop.id,
          customerId: session.user.id,
          status: "COMPLETED",
          review: null,
        },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const openingHours = shop.openingHours as OpeningHours | null;
  const boundReviewAction = createReviewAction.bind(null, shop.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {shop.approvalStatus === "PENDING" && (isOwnerViewing || isAdminViewing) && (
        <div className="card mb-6 border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300">
          ⏳ This shop is pending admin approval and isn&apos;t visible in search yet. Decisions are
          usually made within 24 hours.
        </div>
      )}
      {shop.approvalStatus === "REJECTED" && (isOwnerViewing || isAdminViewing) && (
        <div className="card mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          ❌ This shop was rejected by an admin and isn&apos;t visible in search.
        </div>
      )}
      <div className="card mb-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm sm:block dark:from-zinc-800 dark:to-zinc-900">
            {shop.logoUrl ? (
              <Image src={shop.logoUrl} alt={shop.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl">🔧</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
              {shop.isVerified && <span className="badge-open">✓ Verified</span>}
            </div>
            <p className="mt-1 text-sm text-zinc-500">{shop.categories.join(" · ")}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-zinc-500 hover:text-orange-600 hover:underline"
            >
              📍 {shop.address}
            </a>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {avgRating !== null ? (
                <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  ⭐ {avgRating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                </span>
              ) : (
                <span className="badge-closed">No reviews yet</span>
              )}
              <span className={isOpenNow(shop.openingHours) ? "badge-open" : "badge-closed"}>
                {isOpenNow(shop.openingHours) ? "Open now" : "Closed"}
              </span>
            </div>
          </div>
        </div>
        {session?.user?.id === shop.ownerId ? (
          <span className="badge-closed shrink-0">This is your shop</span>
        ) : (
          <Link href={`/shops/${shop.id}/book`} className="btn-primary shrink-0">
            Book a repair
          </Link>
        )}
      </div>

      {shop.description && (
        <p className="mb-6 text-zinc-700 dark:text-zinc-300">{shop.description}</p>
      )}

      {shop.photos.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Photos</h2>
          <div className="flex gap-3 overflow-x-auto">
            {shop.photos.map((photo) => (
              <div
                key={photo.id}
                className="relative h-40 w-56 shrink-0 overflow-hidden rounded-2xl shadow-sm"
              >
                <Image src={photo.url} alt={shop.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Contact</h2>
          <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            {shop.phone && <li>📞 {shop.phone}</li>}
            {shop.whatsapp && <li>💬 WhatsApp: {shop.whatsapp}</li>}
            {shop.email && <li>✉️ {shop.email}</li>}
            {shop.website && (
              <li>
                🌐{" "}
                <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                  {shop.website}
                </a>
              </li>
            )}
            {shop.yearsExperience !== null && <li>🛠️ {shop.yearsExperience} years of experience</li>}
            {shop.certifications && <li>🎓 {shop.certifications}</li>}
          </ul>

          {shop.services.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 font-semibold">Services</h2>
              <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                {shop.services.map((s) => (
                  <li key={s.id} className="flex justify-between border-b border-[var(--border)] pb-2 last:border-0">
                    <span>{s.name}</span>
                    {s.priceFrom != null && <span className="font-medium text-zinc-700 dark:text-zinc-300">from ${s.priceFrom}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Opening hours</h2>
          <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            {openingHours &&
              DAY_LABELS.map(({ key, label }) => {
                const day = openingHours[key];
                return (
                  <li key={key} className="flex justify-between border-b border-[var(--border)] pb-2 last:border-0">
                    <span>{label}</span>
                    <span className={day?.closed ? "text-zinc-400" : "font-medium text-zinc-700 dark:text-zinc-300"}>
                      {day?.closed ? "Closed" : `${day?.open} – ${day?.close}`}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <div className="card flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Location</h2>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              Get directions ↗
            </a>
          </div>
          <div className="h-72 overflow-hidden rounded-xl border border-[var(--border)]">
            <MapView
              shops={[
                {
                  id: shop.id,
                  name: shop.name,
                  latitude: shop.latitude,
                  longitude: shop.longitude,
                },
              ]}
              center={[shop.latitude, shop.longitude]}
              zoom={15}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        {reviewableBooking && (
          <div className="mb-6">
            <ReviewForm action={boundReviewAction} bookingId={reviewableBooking.id} />
          </div>
        )}
        {shop.reviews.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {shop.reviews.map((review) => (
              <li key={review.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.customer.name}</span>
                  <StarRating value={review.overallRating} readOnly size="text-sm" />
                </div>
                {review.comment && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
