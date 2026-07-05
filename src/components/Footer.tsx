import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-sm shadow-sm shadow-orange-600/30">
              🔧
            </span>
            RepairHub
          </Link>
          <p className="mt-2 text-sm text-zinc-500">
            Find and book trusted repair shops near you — free, always.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">For Customers</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-500">
            <li>
              <Link href="/" className="hover:text-orange-600">
                Find a repair shop
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-orange-600">
                Create an account
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-orange-600">
                Log in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">For Shop Owners</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-500">
            <li>
              <Link href="/register-shop" className="hover:text-orange-600">
                Register your shop
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-orange-600">
                Owner dashboard
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-orange-600">
                Log in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Categories</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-500">
            <li>Motorcycle · Bicycle</li>
            <li>Car · Truck · Tractor</li>
            <li>Electric Bike · ATV</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)] py-4">
        <p className="text-center text-xs text-zinc-400">© {year} RepairHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
