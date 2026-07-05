"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";
import { shopSchema } from "@/lib/validations";

export interface ShopFormState {
  error?: string;
  success?: boolean;
}

function parseShopForm(formData: FormData) {
  return shopSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categories: formData.getAll("categories"),
    address: formData.get("address"),
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
    yearsExperience: formData.get("yearsExperience") || undefined,
    certifications: formData.get("certifications") || undefined,
    openingHours: JSON.parse((formData.get("openingHours") as string) || "{}"),
    services: JSON.parse((formData.get("services") as string) || "[]"),
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
  });
}

export async function createShopAction(
  _prevState: ShopFormState,
  formData: FormData
): Promise<ShopFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SHOP_OWNER") {
    return { error: "Only shop owners can register a shop" };
  }

  const existing = await prisma.shop.findUnique({ where: { ownerId: session.user.id } });
  if (existing) {
    return { error: "You already have a registered shop" };
  }

  const parsed = parseShopForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let address = parsed.data.address;
  let latitude = parsed.data.latitude;
  let longitude = parsed.data.longitude;

  if (latitude == null || longitude == null) {
    const geo = await geocodeAddress(address);
    if (!geo) {
      return { error: "Could not find that address. Try a more specific address, or use the Locate button." };
    }
    address = geo.displayName;
    latitude = geo.latitude;
    longitude = geo.longitude;
  }

  const { services, ...shopData } = parsed.data;

  const approvalDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.shop.create({
    data: {
      ...shopData,
      address,
      latitude,
      longitude,
      ownerId: session.user.id,
      approvalStatus: "PENDING",
      approvalDeadline,
      services: services?.length
        ? { createMany: { data: services } }
        : undefined,
    },
  });

  revalidatePath("/");
  redirect(`/dashboard/profile?welcome=1`);
}

export async function updateShopAction(
  shopId: string,
  _prevState: ShopFormState,
  formData: FormData
): Promise<ShopFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in" };
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop || shop.ownerId !== session.user.id) {
    return { error: "Not authorized to edit this shop" };
  }

  const parsed = parseShopForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let address = parsed.data.address;
  let latitude = parsed.data.latitude;
  let longitude = parsed.data.longitude;

  if (latitude == null || longitude == null) {
    const geo = await geocodeAddress(address);
    if (!geo) {
      return { error: "Could not find that address. Try a more specific address, or use the Locate button." };
    }
    address = geo.displayName;
    latitude = geo.latitude;
    longitude = geo.longitude;
  }

  const { services, ...shopData } = parsed.data;

  await prisma.$transaction([
    prisma.service.deleteMany({ where: { shopId } }),
    prisma.shop.update({
      where: { id: shopId },
      data: {
        ...shopData,
        address,
        latitude,
        longitude,
        services: services?.length ? { createMany: { data: services } } : undefined,
      },
    }),
  ]);

  revalidatePath(`/shops/${shopId}`);
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function addShopPhotoAction(shopId: string, url: string) {
  const session = await auth();
  if (!session?.user) throw new Error("You must be signed in");

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop || shop.ownerId !== session.user.id) {
    throw new Error("Not authorized to edit this shop");
  }

  await prisma.shopPhoto.create({ data: { shopId, url } });
  revalidatePath(`/shops/${shopId}`);
  revalidatePath("/dashboard/profile");
}

export async function updateShopLogoAction(shopId: string, url: string | null) {
  const session = await auth();
  if (!session?.user) throw new Error("You must be signed in");

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop || shop.ownerId !== session.user.id) {
    throw new Error("Not authorized to edit this shop");
  }

  await prisma.shop.update({ where: { id: shopId }, data: { logoUrl: url } });
  revalidatePath(`/shops/${shopId}`);
  revalidatePath("/dashboard/profile");
  revalidatePath("/");
}

export async function removeShopPhotoAction(photoId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("You must be signed in");

  const photo = await prisma.shopPhoto.findUnique({
    where: { id: photoId },
    include: { shop: true },
  });
  if (!photo || photo.shop.ownerId !== session.user.id) {
    throw new Error("Not authorized");
  }

  await prisma.shopPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/shops/${photo.shopId}`);
  revalidatePath("/dashboard/profile");
}
