import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotificationBell from "@/components/NotificationBell";

export default async function Nav() {
  const session = await auth();

  const notifications = session?.user
    ? await prisma.notification.findMany({
        where: { userId: session.user.id, isRead: false },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-base shadow-sm shadow-orange-600/30">
            🔧
          </span>
          RepairHub
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <NotificationBell notifications={notifications} />
              {session.user.role !== "ADMIN" && (
                <Link href="/bookings" className="btn-ghost">
                  My Bookings
                </Link>
              )}
              {session.user.role === "SHOP_OWNER" && (
                <Link href="/dashboard" className="btn-ghost">
                  Dashboard
                </Link>
              )}
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="btn-ghost">
                  Admin
                </Link>
              )}
              <span className="hidden text-zinc-500 sm:inline">{session.user.name}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn-ghost">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
