import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS_OPTIONS, buildBookingDetailWhere } from "@/lib/bookingReportFilter";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-pending",
  ACCEPTED: "badge-accepted",
  COMPLETED: "badge-completed",
  DECLINED: "badge-declined",
  CANCELLED: "badge-closed",
};

export default async function DashboardReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string; status?: string }>;
}) {
  const { from, to, q, status } = await searchParams;
  const session = await auth();
  const shop = await prisma.shop.findUnique({ where: { ownerId: session!.user.id } });
  if (!shop) return null;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
  if (to) dateFilter.lte = new Date(`${to}T23:59:59`);
  const hasDateFilter = Boolean(from || to);
  const hasStatusFilter = Boolean(
    status && (BOOKING_STATUS_OPTIONS as readonly string[]).includes(status)
  );
  const hasAnyFilter = hasDateFilter || Boolean(q) || hasStatusFilter;

  // Summary stats: completed, revenue-generating work only, scoped by completion date
  // (Booking has no separate completedAt field — updatedAt is a safe proxy since a
  // completed booking's last write is the completion itself).
  const completedWhere = {
    shopId: shop.id,
    status: "COMPLETED" as const,
    ...(hasDateFilter ? { updatedAt: dateFilter } : {}),
  };

  // Customer detail table: every booking regardless of status, scoped by booking date,
  // so "fix status" actually varies row to row. Shared with the CSV export route so the
  // download always matches exactly what's on screen.
  const detailWhere = buildBookingDetailWhere(shop.id, { from, to, q, status });

  const exportParams = new URLSearchParams();
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  if (q) exportParams.set("q", q);
  if (hasStatusFilter) exportParams.set("status", status!);
  const csvExportHref = `/api/reports/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;
  const xlsxParams = new URLSearchParams(exportParams);
  xlsxParams.set("format", "xlsx");
  const xlsxExportHref = `/api/reports/export?${xlsxParams.toString()}`;

  const [aggregate, distinctCustomers, bookings] = await Promise.all([
    prisma.booking.aggregate({
      where: completedWhere,
      _sum: { amountCharged: true },
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      where: completedWhere,
      select: { customerId: true },
      distinct: ["customerId"],
    }),
    prisma.booking.findMany({
      where: detailWhere,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalBalance = aggregate._sum.amountCharged ?? 0;
  const totalCompleted = aggregate._count._all;
  const totalCustomers = distinctCustomers.length;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Reports</h2>

      <form method="get" className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="field-label" htmlFor="q">
            Search customer
          </label>
          <input
            id="q"
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Name or phone..."
            className="field"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="status">
            Fix status
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field">
            <option value="">All</option>
            {BOOKING_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="from">
            From
          </label>
          <input id="from" type="date" name="from" defaultValue={from} className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="to">
            To
          </label>
          <input id="to" type="date" name="to" defaultValue={to} className="field" />
        </div>
        <button type="submit" className="btn-primary px-4 py-2">
          Apply
        </button>
        {hasAnyFilter && (
          <Link href="/dashboard/reports" className="btn-secondary px-4 py-2">
            Clear
          </Link>
        )}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-zinc-500">Total customers</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{totalCustomers}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-zinc-500">Total balance</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">${totalBalance.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-zinc-500">Completed repairs</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{totalCompleted}</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Customer detail</h3>
          {bookings.length > 0 && (
            <div className="flex gap-2">
              <a href={csvExportHref} className="btn-secondary px-3 py-1.5 text-sm">
                Export CSV
              </a>
              <a href={xlsxExportHref} className="btn-secondary px-3 py-1.5 text-sm">
                Export Excel
              </a>
            </div>
          )}
        </div>
        {bookings.length === 0 ? (
          <div className="card p-10 text-center text-sm text-zinc-500">
            No bookings in this range.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-zinc-500">
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Customer</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Phone</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Booking date</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Preferred fix date</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Fix status</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Completed date</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{booking.customer.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {booking.customer.phone ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {booking.createdAt.toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {booking.preferredDate.toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={STATUS_BADGE[booking.status]}>{booking.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {booking.status === "COMPLETED" ? booking.updatedAt.toLocaleDateString() : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {booking.amountCharged != null ? `$${booking.amountCharged.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
