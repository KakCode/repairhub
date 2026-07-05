import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildBookingDetailWhere } from "@/lib/bookingReportFilter";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADER = [
  "Customer",
  "Phone",
  "Booking Date",
  "Preferred Fix Date",
  "Fix Status",
  "Completed Date",
  "Amount",
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const shop = await prisma.shop.findUnique({ where: { ownerId: session.user.id } });
  if (!shop) {
    return NextResponse.json({ error: "No shop found" }, { status: 404 });
  }

  const { searchParams } = req.nextUrl;
  const where = buildBookingDetailWhere(shop.id, {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  const bookings = await prisma.booking.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = bookings.map((booking) => [
    booking.customer.name,
    booking.customer.phone ?? "",
    booking.createdAt.toLocaleDateString(),
    booking.preferredDate.toLocaleDateString(),
    booking.status,
    booking.status === "COMPLETED" ? booking.updatedAt.toLocaleDateString() : "",
    booking.amountCharged != null ? booking.amountCharged.toFixed(2) : "",
  ]);

  const datestamp = new Date().toISOString().slice(0, 10);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bookings");
    worksheet.addRow(HEADER).font = { bold: true };
    rows.forEach((row) => worksheet.addRow(row));
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="booking-report-${datestamp}.xlsx"`,
      },
    });
  }

  const csv = [HEADER, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-report-${datestamp}.csv"`,
    },
  });
}
