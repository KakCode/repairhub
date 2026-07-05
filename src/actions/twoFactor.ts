"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTotpSecret, getTotpQrCodeDataUrl, verifyTotpCode } from "@/lib/totp";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  return session.user;
}

export async function startTwoFactorEnrollmentAction(): Promise<{ qrCodeDataUrl: string }> {
  const sessionUser = await requireAdmin();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  // Reuse an already-generated-but-unconfirmed secret so refreshing the setup
  // page doesn't invalidate a code the admin already scanned into their app.
  const secret = user.twoFactorSecret ?? createTotpSecret();
  if (!user.twoFactorSecret) {
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });
  }

  const qrCodeDataUrl = await getTotpQrCodeDataUrl(secret, user.email);
  return { qrCodeDataUrl };
}

export interface ConfirmTwoFactorState {
  error?: string;
  success?: boolean;
}

export async function confirmTwoFactorAction(
  _prevState: ConfirmTwoFactorState,
  formData: FormData
): Promise<ConfirmTwoFactorState> {
  const sessionUser = await requireAdmin();

  const code = (formData.get("code") as string)?.trim();
  if (!code) return { error: "Enter the 6-digit code" };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  if (!user.twoFactorSecret) {
    return { error: "Start enrollment first by reloading this page." };
  }

  const valid = await verifyTotpCode(user.twoFactorSecret, code);
  if (!valid) {
    return { error: "Invalid code. Check your authenticator app and try again." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  return { success: true };
}
