"use server";

import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/passwordHash";

export interface SignUpState {
  error?: string;
  success?: boolean;
}

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, phone, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: { name, email, phone, passwordHash, role },
  });

  return { success: true };
}
