import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobileAuth";
import { completionSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const mobileUser = await getMobileUser(req);
  if (!mobileUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { shop: true },
  });
  if (!booking || booking.shop.ownerId !== mobileUser.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (body.action === "respond") {
    if (body.status !== "ACCEPTED" && body.status !== "DECLINED") {
      return NextResponse.json({ error: "status must be ACCEPTED or DECLINED" }, { status: 400 });
    }

    await prisma.booking.update({ where: { id }, data: { status: body.status } });

    const messages: Record<"ACCEPTED" | "DECLINED", string> = {
      ACCEPTED: "Your booking request was accepted",
      DECLINED: "Your booking request was declined",
    };

    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        type: `BOOKING_${body.status}`,
        message: messages[body.status as "ACCEPTED" | "DECLINED"],
        relatedBookingId: booking.id,
      },
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "complete") {
    if (booking.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Only accepted bookings can be marked completed" },
        { status: 400 }
      );
    }

    const parsed = completionSchema.safeParse({ summary: body.summary, amount: body.amount });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completionSummary: parsed.data.summary,
        amountCharged: parsed.data.amount ?? null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        type: "BOOKING_COMPLETED",
        message: "Your booking was marked as completed — view the report and leave a review!",
        relatedBookingId: booking.id,
      },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
