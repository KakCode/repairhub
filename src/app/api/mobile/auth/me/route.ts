import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUser } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const mobileUser = await getMobileUser(req);
  if (!mobileUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: mobileUser.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const shop = await prisma.shop.findUnique({ where: { ownerId: user.id } });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hasShop: !!shop,
  });
}
