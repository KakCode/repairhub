import type { NextRequest } from "next/server";
import { verifyMobileToken, type MobileTokenPayload } from "@/lib/mobileJwt";

export interface MobileUser {
  userId: string;
  role: MobileTokenPayload["role"];
}

export async function getMobileUser(req: NextRequest): Promise<MobileUser | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const payload = await verifyMobileToken(token);
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
