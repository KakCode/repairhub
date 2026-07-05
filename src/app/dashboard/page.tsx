import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingActions from "@/components/BookingActions";

const STATUS_ORDER = ["PENDING", "ACCEPTED", "COMPLETED", "DECLINED", "CANCELLED"];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-pending",
  ACCEPTED: "badge-accepted",
  COMPLETED: "badge-completed",
  DECLINED: "badge-declined",
  CANCELLED: "badge-closed",
};

export default async function DashboardBookingsPage() {
  const session = await auth();
  const shop = await prisma.shop.findUnique({ where: { ownerId: session!.user.id } });
  if (!shop) return null;

  const bookings = await prisma.booking.findMany({
    where: { shopId: shop.id },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const sorted = [...bookings].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Booking requests</h2>
      {sorted.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-500">No booking requests yet.</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((booking) => (
            <li
              key={booking.id}
              className="card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">
                  {booking.vehicleType} — {booking.customer.name}
                </p>
                <p className="text-sm text-zinc-500">{booking.problemDescription}</p>
                <p className="text-xs text-zinc-400">
                  Preferred: {new Date(booking.preferredDate).toLocaleDateString()} at{" "}
                  {booking.preferredTime}
                </p>
                <span className={`mt-2 inline-block ${STATUS_BADGE[booking.status]}`}>
                  {booking.status}
                </span>
                {booking.status === "COMPLETED" && booking.completionSummary && (
                  <div className="mt-2 max-w-sm rounded-lg border border-[var(--border)] bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                    <p className="text-zinc-600 dark:text-zinc-400">{booking.completionSummary}</p>
                    {booking.amountCharged != null && (
                      <p className="mt-1 font-medium">Charged: ${booking.amountCharged.toFixed(2)}</p>
                    )}
                  </div>
                )}
                {booking.photoUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {booking.photoUrls.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-14 w-14 overflow-hidden rounded-lg border border-[var(--border)]"
                      >
                        <Image src={url} alt={`Booking photo ${i + 1}`} fill className="object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <BookingActions bookingId={booking.id} status={booking.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
