import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwordHash";
import { signMobileToken } from "@/lib/mobileJwt";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin accounts cannot use the mobile app" },
      { status: 401 }
    );
  }

  const token = await signMobileToken({ sub: user.id, role: user.role });

  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
