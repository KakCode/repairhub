import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobileAuth";
import { reviewSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const mobileUser = await getMobileUser(req);
  if (!mobileUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { bookingId, ...ratings } = parsed.data;

  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.customerId !== mobileUser.userId || booking.shopId !== body.shopId) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only review completed bookings" },
        { status: 400 }
      );
    }
    const existingReview = await prisma.review.findUnique({ where: { bookingId } });
    if (existingReview) {
      return NextResponse.json({ error: "You already reviewed this booking" }, { status: 409 });
    }
  }

  const review = await prisma.review.create({
    data: {
      shopId: body.shopId,
      customerId: mobileUser.userId,
      bookingId: bookingId || null,
      status: "APPROVED",
      ...ratings,
    },
  });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
