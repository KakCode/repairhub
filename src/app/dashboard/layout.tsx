import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    redirect("/login");
  }

  const shop = await prisma.shop.findUnique({ where: { ownerId: session.user.id } });
  if (!shop) {
    redirect("/register-shop");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
        <nav className="flex gap-2 text-sm">
          <Link href="/dashboard" className="chip">
            Bookings
          </Link>
          <Link href="/dashboard/reports" className="chip">
            Reports
          </Link>
          <Link href="/dashboard/profile" className="chip">
            Edit profile
          </Link>
          <Link href={`/shops/${shop.id}`} className="chip">
            View public page ↗
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
