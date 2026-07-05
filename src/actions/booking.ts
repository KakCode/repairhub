"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema, completionSchema } from "@/lib/validations";

export interface BookingFormState {
  error?: string;
  success?: boolean;
}

export async function createBookingAction(
  shopId: string,
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in to request a booking" };
  }

  const parsed = bookingSchema.safeParse({
    vehicleType: formData.get("vehicleType"),
    problemDescription: formData.get("problemDescription"),
    preferredDate: formData.get("preferredDate"),
    preferredTime: formData.get("preferredTime"),
    photoUrls: JSON.parse((formData.get("photoUrls") as string) || "[]"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop || shop.approvalStatus !== "APPROVED") {
    return { error: "Shop not found" };
  }

  if (shop.ownerId === session.user.id) {
    return { error: "You can't book a repair at your own shop" };
  }

  const booking = await prisma.booking.create({
    data: {
      shopId,
      customerId: session.user.id,
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

  revalidatePath("/dashboard");
  return { success: true };
}

export async function respondToBookingAction(
  bookingId: string,
  status: "ACCEPTED" | "DECLINED"
) {
  const session = await auth();
  if (!session?.user) throw new Error("You must be signed in");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { shop: true },
  });
  if (!booking || booking.shop.ownerId !== session.user.id) {
    throw new Error("Not authorized");
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status } });

  const messages: Record<typeof status, string> = {
    ACCEPTED: "Your booking request was accepted",
    DECLINED: "Your booking request was declined",
  };

  await prisma.notification.create({
    data: {
      userId: booking.customerId,
      type: `BOOKING_${status}`,
      message: messages[status],
      relatedBookingId: booking.id,
    },
  });

  revalidatePath("/dashboard");
}

export interface CompleteBookingFormState {
  error?: string;
  success?: boolean;
}

export async function completeBookingAction(
  bookingId: string,
  _prevState: CompleteBookingFormState,
  formData: FormData
): Promise<CompleteBookingFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { shop: true },
  });
  if (!booking || booking.shop.ownerId !== session.user.id) {
    return { error: "Not authorized" };
  }
  if (booking.status !== "ACCEPTED") {
    return { error: "Only accepted bookings can be marked completed" };
  }

  const parsed = completionSchema.safeParse({
    summary: formData.get("summary"),
    amount: formData.get("amount") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.booking.update({
    where: { id: bookingId },
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

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  return { success: true };
}

export async function markNotificationsReadAction() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard");
}
