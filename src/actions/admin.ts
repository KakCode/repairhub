"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}

export interface CategoryFormState {
  error?: string;
  success?: boolean;
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  if (!name) {
    return { error: "Enter a category name" };
  }

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    return { error: "That category already exists" };
  }

  await prisma.category.create({ data: { name } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/register-shop");
  return { success: true };
}

export async function renameCategoryAction(id: string, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name can't be empty");

  await prisma.category.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

export async function verifyShopAction(shopId: string, verified: boolean) {
  await requireAdmin();
  await prisma.shop.update({ where: { id: shopId }, data: { isVerified: verified } });
  revalidatePath("/admin/shops");
  revalidatePath(`/shops/${shopId}`);
  revalidatePath("/");
}

export async function deleteShopAction(shopId: string) {
  await requireAdmin();
  await prisma.shop.delete({ where: { id: shopId } });
  revalidatePath("/admin/shops");
  revalidatePath("/");
}

export async function approveShopAction(shopId: string) {
  await requireAdmin();
  await prisma.shop.update({ where: { id: shopId }, data: { approvalStatus: "APPROVED" } });
  revalidatePath("/admin/shops");
  revalidatePath("/admin");
  revalidatePath(`/shops/${shopId}`);
  revalidatePath("/dashboard/profile");
  revalidatePath("/");
}

export async function rejectShopAction(shopId: string) {
  await requireAdmin();
  await prisma.shop.update({ where: { id: shopId }, data: { approvalStatus: "REJECTED" } });
  revalidatePath("/admin/shops");
  revalidatePath("/admin");
  revalidatePath(`/shops/${shopId}`);
  revalidatePath("/dashboard/profile");
  revalidatePath("/");
}

export async function approveReviewAction(reviewId: string) {
  await requireAdmin();
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "APPROVED" },
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/shops/${review.shopId}`);
}

export async function rejectReviewAction(reviewId: string) {
  await requireAdmin();
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/shops/${review.shopId}`);
}
