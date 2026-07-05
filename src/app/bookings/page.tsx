import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-pending",
  ACCEPTED: "badge-accepted",
  COMPLETED: "badge-completed",
  DECLINED: "badge-declined",
  CANCELLED: "badge-closed",
};

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/bookings");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.user.id },
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">My bookings</h1>
      {bookings.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-500">
          You haven&apos;t booked a repair yet.{" "}
          <Link href="/" className="text-orange-600 hover:underline">
            Find a shop
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/shops/${booking.shopId}`} className="font-medium hover:text-orange-600">
                    {booking.shop.name}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {booking.vehicleType} — {booking.problemDescription}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Preferred: {new Date(booking.preferredDate).toLocaleDateString()} at{" "}
                    {booking.preferredTime}
                  </p>
                </div>
                <span className={STATUS_BADGE[booking.status]}>{booking.status}</span>
              </div>
              {booking.status === "COMPLETED" && booking.completionSummary && (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                  <p className="mb-1 font-medium">Repair report</p>
                  <p className="text-zinc-600 dark:text-zinc-400">{booking.completionSummary}</p>
                  {booking.amountCharged != null && (
                    <p className="mt-2 font-semibold">
                      Amount charged: ${booking.amountCharged.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
