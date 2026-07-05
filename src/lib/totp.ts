import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const ISSUER = "RepairHub";

export function createTotpSecret(): string {
  return generateSecret();
}

export function getTotpUri(secret: string, accountEmail: string): string {
  return generateURI({ issuer: ISSUER, label: accountEmail, secret });
}

export async function getTotpQrCodeDataUrl(secret: string, accountEmail: string): Promise<string> {
  const uri = getTotpUri(secret, accountEmail);
  return QRCode.toDataURL(uri);
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const result = await verify({ secret, token: code, epochTolerance: 30 });
  return result.valid;
}
