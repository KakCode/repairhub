import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES } from "../src/lib/validations";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Alex Customer",
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const shopsData = [
    {
      ownerEmail: "downtownmoto@example.com",
      ownerName: "Sam Rivera",
      shop: {
        name: "Downtown Moto Repair",
        description: "Fast, honest motorcycle and scooter repair in the heart of the city.",
        categories: ["Motorcycle", "Scooter"],
        address: "350 5th Ave, New York, NY 10118, USA",
        latitude: 40.7484,
        longitude: -73.9857,
        phone: "+1 212 555 0101",
        yearsExperience: 12,
        certifications: "ASE Certified",
      },
      services: [
        { name: "Oil change", priceFrom: 30 },
        { name: "Tire replacement", priceFrom: 60 },
        { name: "Full tune-up", priceFrom: 120 },
      ],
    },
    {
      ownerEmail: "citybike@example.com",
      ownerName: "Jamie Chen",
      shop: {
        name: "City Bike Fix",
        description: "Your neighborhood bicycle and e-bike specialists.",
        categories: ["Bicycle", "Electric Bike"],
        address: "30 Rockefeller Plaza, New York, NY 10112, USA",
        latitude: 40.7587,
        longitude: -73.9787,
        phone: "+1 212 555 0102",
        yearsExperience: 6,
      },
      services: [
        { name: "Flat tire fix", priceFrom: 15 },
        { name: "Chain replacement", priceFrom: 25 },
        { name: "E-bike battery check", priceFrom: 20 },
      ],
    },
    {
      ownerEmail: "greenvalley@example.com",
      ownerName: "Pat Johnson",
      shop: {
        name: "Green Valley Tractor Service",
        description: "On-site and in-shop repair for tractors and farm equipment.",
        categories: ["Tractor", "Agricultural Machine", "ATV"],
        address: "1 Bryant Park, New York, NY 10036, USA",
        latitude: 40.7536,
        longitude: -73.9832,
        phone: "+1 212 555 0103",
        yearsExperience: 20,
        certifications: "Certified Diesel Mechanic",
      },
      services: [
        { name: "Field breakdown callout", priceFrom: 80 },
        { name: "Engine diagnostics", priceFrom: 50 },
      ],
    },
  ];

  const openingHours = {
    mon: { closed: false, open: "08:00", close: "18:00" },
    tue: { closed: false, open: "08:00", close: "18:00" },
    wed: { closed: false, open: "08:00", close: "18:00" },
    thu: { closed: false, open: "08:00", close: "18:00" },
    fri: { closed: false, open: "08:00", close: "18:00" },
    sat: { closed: false, open: "09:00", close: "14:00" },
    sun: { closed: true },
  };

  const createdShops = [];
  for (const entry of shopsData) {
    const owner = await prisma.user.upsert({
      where: { email: entry.ownerEmail },
      update: {},
      create: {
        email: entry.ownerEmail,
        name: entry.ownerName,
        passwordHash,
        role: "SHOP_OWNER",
      },
    });

    const shop = await prisma.shop.upsert({
      where: { ownerId: owner.id },
      update: {},
      create: {
        ownerId: owner.id,
        ...entry.shop,
        openingHours,
        services: { createMany: { data: entry.services } },
      },
    });

    createdShops.push(shop);
  }

  const firstShop = createdShops[0];
  const existingBooking = await prisma.booking.findFirst({
    where: { shopId: firstShop.id, customerId: customer.id },
  });

  const booking =
    existingBooking ??
    (await prisma.booking.create({
      data: {
        shopId: firstShop.id,
        customerId: customer.id,
        vehicleType: "Motorcycle",
        problemDescription: "Engine won't start in the morning.",
        preferredDate: new Date(),
        preferredTime: "10:00",
        status: "COMPLETED",
      },
    }));

  await prisma.review.upsert({
    where: { bookingId: booking.id },
    update: { status: "APPROVED" },
    create: {
      shopId: firstShop.id,
      customerId: customer.id,
      bookingId: booking.id,
      qualityRating: 5,
      priceRating: 4,
      speedRating: 5,
      friendlinessRating: 5,
      overallRating: 5,
      comment: "Fixed my bike in under an hour. Great service!",
      status: "APPROVED",
    },
  });

  console.log("Seed complete. Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log("  admin@example.com (admin)");
  console.log("  customer@example.com (customer)");
  for (const entry of shopsData) {
    console.log(`  ${entry.ownerEmail} (shop owner — ${entry.shop.name})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
