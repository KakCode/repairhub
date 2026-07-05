"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations";

export interface ReviewFormState {
  error?: string;
  success?: boolean;
}

export async function createReviewAction(
  shopId: string,
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in to leave a review" };
  }

  const parsed = reviewSchema.safeParse({
    qualityRating: formData.get("qualityRating"),
    priceRating: formData.get("priceRating"),
    speedRating: formData.get("speedRating"),
    friendlinessRating: formData.get("friendlinessRating"),
    overallRating: formData.get("overallRating"),
    comment: formData.get("comment") || undefined,
    bookingId: formData.get("bookingId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { bookingId, ...ratings } = parsed.data;

  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.customerId !== session.user.id || booking.shopId !== shopId) {
      return { error: "Booking not found" };
    }
    if (booking.status !== "COMPLETED") {
      return { error: "You can only review completed bookings" };
    }
    const existingReview = await prisma.review.findUnique({ where: { bookingId } });
    if (existingReview) {
      return { error: "You already reviewed this booking" };
    }
  }

  await prisma.review.create({
    data: {
      shopId,
      customerId: session.user.id,
      bookingId: bookingId || null,
      status: "APPROVED",
      ...ratings,
    },
  });

  revalidatePath(`/shops/${shopId}`);
  return { success: true };
}
