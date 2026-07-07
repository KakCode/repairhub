import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobileAuth";
import { autoApproveOverdueShops } from "@/lib/shopApproval";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mobileUser = await getMobileUser(req);

  await autoApproveOverdueShops();

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      photos: true,
      services: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const isOwnerViewing = mobileUser?.userId === shop.ownerId;
  if (shop.approvalStatus !== "APPROVED" && !isOwnerViewing) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const reviewCount = shop.reviews.length;
  const avgRating = reviewCount
    ? shop.reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewCount
    : null;

  const reviewableBooking = mobileUser
    ? await prisma.booking.findFirst({
        where: {
          shopId: shop.id,
          customerId: mobileUser.userId,
          status: "COMPLETED",
          review: null,
        },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return NextResponse.json({
    id: shop.id,
    name: shop.name,
    description: shop.description,
    categories: shop.categories,
    logoUrl: shop.logoUrl,
    photos: shop.photos.map((p) => ({ id: p.id, url: p.url })),
    services: shop.services.map((s) => ({ id: s.id, name: s.name, priceFrom: s.priceFrom })),
    address: shop.address,
    latitude: shop.latitude,
    longitude: shop.longitude,
    phone: shop.phone,
    whatsapp: shop.whatsapp,
    email: shop.email,
    website: shop.website,
    openingHours: shop.openingHours,
    yearsExperience: shop.yearsExperience,
    certifications: shop.certifications,
    isVerified: shop.isVerified,
    approvalStatus: shop.approvalStatus,
    moderationNote: shop.moderationNote,
    avgRating,
    reviewCount,
    reviews: shop.reviews.map((r) => ({
      id: r.id,
      customerName: r.customer.name,
      qualityRating: r.qualityRating,
      priceRating: r.priceRating,
      speedRating: r.speedRating,
      friendlinessRating: r.friendlinessRating,
      overallRating: r.overallRating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    isOwner: isOwnerViewing,
    reviewableBookingId: reviewableBooking?.id ?? null,
  });
}
