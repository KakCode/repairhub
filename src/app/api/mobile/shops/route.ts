import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOpenNow } from "@/lib/openingHours";
import { autoApproveOverdueShops } from "@/lib/shopApproval";

export async function GET() {
  await autoApproveOverdueShops();

  const shops = await prisma.shop.findMany({
    where: { approvalStatus: "APPROVED" },
    include: { photos: true, reviews: { where: { status: "APPROVED" } } },
    orderBy: { createdAt: "desc" },
  });

  const result = shops.map((shop) => {
    const reviewCount = shop.reviews.length;
    const rating = reviewCount
      ? shop.reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewCount
      : null;

    return {
      id: shop.id,
      name: shop.name,
      categories: shop.categories,
      address: shop.address,
      latitude: shop.latitude,
      longitude: shop.longitude,
      photoUrl: shop.logoUrl ?? shop.photos[0]?.url ?? null,
      rating,
      reviewCount,
      isOpenNow: isOpenNow(shop.openingHours),
      isVerified: shop.isVerified,
    };
  });

  return NextResponse.json({ shops: result });
}
