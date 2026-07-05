import Image from "next/image";
import { startTwoFactorEnrollmentAction } from "@/actions/twoFactor";
import TwoFactorSetupForm from "@/components/TwoFactorSetupForm";

export default async function AdminSetupTwoFactorPage() {
  const { qrCodeDataUrl } = await startTwoFactorEnrollmentAction();

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Set up two-factor authentication</h1>
      <p className="mb-6 text-zinc-500">
        Admin accounts require an authenticator app (like Google Authenticator or Authy). Scan this
        QR code, then enter the 6-digit code it shows to finish setup.
      </p>
      <div className="card mb-6 flex justify-center p-6">
        <Image src={qrCodeDataUrl} alt="Two-factor authentication QR code" width={220} height={220} unoptimized />
      </div>
      <TwoFactorSetupForm />
    </div>
  );
}
