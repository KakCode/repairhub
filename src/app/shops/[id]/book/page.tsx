import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBookingAction } from "@/actions/booking";
import BookingForm from "@/components/BookingForm";

export default async function BookShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/shops/${id}/book`);
  }

  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop || shop.approvalStatus !== "APPROVED") notFound();

  if (shop.ownerId === session!.user.id) {
    redirect(`/shops/${id}`);
  }

  const boundAction = createBookingAction.bind(null, shop.id);
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Book {shop.name}</h1>
      <p className="mb-6 text-zinc-500">
        Tell them what&apos;s wrong and when you&apos;d like to come in.
      </p>
      <BookingForm action={boundAction} categories={categories.map((c) => c.name)} />
    </div>
  );
}
