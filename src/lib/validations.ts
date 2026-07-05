import { z } from "zod";

// Initial data for prisma/seed.ts only. At runtime, categories are managed
// by admins and come from the Category table, not this list.
export const CATEGORIES = [
  "Motorcycle",
  "Scooter",
  "Bicycle",
  "Car",
  "Truck",
  "Tractor",
  "ATV",
  "Electric Bike",
  "Boat",
  "Generator",
  "Agricultural Machine",
] as const;

export const signUpSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CUSTOMER", "SHOP_OWNER"]),
});

export const dayHoursSchema = z.object({
  closed: z.boolean(),
  open: z.string().optional(),
  close: z.string().optional(),
});

export const openingHoursSchema = z.object({
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
  sun: dayHoursSchema,
});

export type OpeningHours = z.infer<typeof openingHoursSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1),
  priceFrom: z.coerce.number().nonnegative().optional(),
});

export const shopSchema = z.object({
  name: z.string().min(2, "Shop name is too short"),
  description: z.string().optional(),
  categories: z.array(z.string().min(1)).min(1, "Pick at least one category"),
  address: z.string().min(5, "Enter a full address"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().nonnegative().optional(),
  certifications: z.string().optional(),
  openingHours: openingHoursSchema,
  services: z.array(serviceSchema).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

function isTodayOrLater(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const picked = new Date(`${dateStr}T00:00:00`);
  return picked >= today;
}

export const bookingSchema = z.object({
  vehicleType: z.string().min(1, "Select a vehicle type"),
  problemDescription: z.string().min(5, "Describe the problem"),
  preferredDate: z
    .string()
    .min(1, "Pick a date")
    .refine(isTodayOrLater, "Preferred date can't be in the past"),
  preferredTime: z.string().min(1, "Pick a time"),
  photoUrls: z.array(z.string()).optional(),
});

export const completionSchema = z.object({
  summary: z.string().min(5, "Describe the work you did"),
  amount: z.coerce.number().nonnegative("Amount can't be negative").optional(),
});

export const reviewSchema = z.object({
  qualityRating: z.coerce.number().int().min(1).max(5),
  priceRating: z.coerce.number().int().min(1).max(5),
  speedRating: z.coerce.number().int().min(1).max(5),
  friendlinessRating: z.coerce.number().int().min(1).max(5),
  overallRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
  bookingId: z.string().optional(),
});
