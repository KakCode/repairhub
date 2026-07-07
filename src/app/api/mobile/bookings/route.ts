import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobileAuth";
import { bookingSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const mobileUser = await getMobileUser(req);
  if (!mobileUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (mobileUser.role === "SHOP_OWNER") {
    const shop = await prisma.shop.findUnique({ where: { ownerId: mobileUser.userId } });
    if (!shop) {
      return NextResponse.json({ bookings: [] });
    }

    const bookings = await prisma.booking.findMany({
      where: { shopId: shop.id },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        status: b.status,
        vehicleType: b.vehicleType,
        problemDescription: b.problemDescription,
        preferredDate: b.preferredDate,
        preferredTime: b.preferredTime,
        photoUrls: b.photoUrls,
        completionSummary: b.completionSummary,
        amountCharged: b.amountCharged,
        createdAt: b.createdAt,
        customer: { id: b.customer.id, name: b.customer.name, phone: b.customer.phone },
      })),
    });
  }

  const bookings = await prisma.booking.findMany({
    where: { customerId: mobileUser.userId },
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      vehicleType: b.vehicleType,
      problemDescription: b.problemDescription,
      preferredDate: b.preferredDate,
      preferredTime: b.preferredTime,
      photoUrls: b.photoUrls,
      completionSummary: b.completionSummary,
      amountCharged: b.amountCharged,
      createdAt: b.createdAt,
      shop: { id: b.shop.id, name: b.shop.name },
    })),
  });
}

export async function POST(req: NextRequest) {
  const mobileUser = await getMobileUser(req);
  if (!mobileUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const shop = await prisma.shop.findUnique({ where: { id: body.shopId } });
  if (!shop || shop.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  if (shop.ownerId === mobileUser.userId) {
    return NextResponse.json(
      { error: "You can't book a repair at your own shop" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      shopId: shop.id,
      customerId: mobileUser.userId,
      vehicleType: parsed.data.vehicleType,
      problemDescription: parsed.data.problemDescription,
      preferredDate: new Date(parsed.data.preferredDate),
      preferredTime: parsed.data.preferredTime,
      photoUrls: parsed.data.photoUrls ?? [],
    },
  });

  await prisma.notification.create({
    data: {
      userId: shop.ownerId,
      type: "BOOKING_REQUEST",
      message: `New booking request for ${parsed.data.vehicleType} repair`,
      relatedBookingId: booking.id,
    },
  });

  return NextResponse.json({ id: booking.id }, { status: 201 });
}
