export const BOOKING_STATUS_OPTIONS = [
  "PENDING",
  "ACCEPTED",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
] as const;

export interface BookingReportFilters {
  from?: string;
  to?: string;
  q?: string;
  status?: string;
}

export function buildBookingDetailWhere(shopId: string, filters: BookingReportFilters) {
  const { from, to, q, status } = filters;
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
  if (to) dateFilter.lte = new Date(`${to}T23:59:59`);
  const hasDateFilter = Boolean(from || to);
  const hasStatusFilter = Boolean(
    status && (BOOKING_STATUS_OPTIONS as readonly string[]).includes(status)
  );

  return {
    shopId,
    ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    ...(hasStatusFilter ? { status: status as (typeof BOOKING_STATUS_OPTIONS)[number] } : {}),
    ...(q
      ? {
          customer: {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };
}
