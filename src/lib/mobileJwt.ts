import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/client";

const secret = new TextEncoder().encode(process.env.MOBILE_AUTH_SECRET);

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export interface MobileTokenPayload {
  sub: string;
  role: Role;
}

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${THIRTY_DAYS_SECONDS}s`)
    .sign(secret);
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return { sub: payload.sub as string, role: payload.role as Role };
}
