import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminGatedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // Layout above already redirects non-admins; this re-checks 2FA enrollment
  // fresh from the DB (not trusted from the JWT) before letting an admin past
  // the setup step.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });
  if (!user.twoFactorEnabled) {
    redirect("/admin/setup-2fa");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <nav className="flex gap-2 text-sm">
          <Link href="/admin" className="chip">
            Overview
          </Link>
          <Link href="/admin/shops" className="chip">
            Shops
          </Link>
          <Link href="/admin/categories" className="chip">
            Categories
          </Link>
          <Link href="/admin/reviews" className="chip">
            Reviews
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
