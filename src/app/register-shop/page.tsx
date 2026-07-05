import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createShopAction } from "@/actions/shop";
import ShopForm from "@/components/ShopForm";

export default async function RegisterShopPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    redirect("/login");
  }

  const existing = await prisma.shop.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    redirect(`/shops/${existing.id}`);
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <span className="badge-open mb-3">Free forever</span>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Register your shop</h1>
      <p className="mb-8 text-zinc-500">
        Customers will be able to find and book you right away.
      </p>
      <ShopForm
        action={createShopAction}
        submitLabel="Create shop"
        availableCategories={categories.map((c) => c.name)}
      />
    </div>
  );
}
