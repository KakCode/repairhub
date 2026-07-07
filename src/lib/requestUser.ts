import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileUser } from "@/lib/mobileAuth";
import type { Role } from "@/generated/prisma/client";

export interface RequestUser {
  userId: string;
  role: Role;
}

export async function getRequestUser(req: NextRequest): Promise<RequestUser | null> {
  const session = await auth();
  if (session?.user) {
    return { userId: session.user.id, role: session.user.role as Role };
  }

  const mobileUser = await getMobileUser(req);
  if (mobileUser) return mobileUser;

  return null;
}
