import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Field-level validators                                            */
/* ------------------------------------------------------------------ */

const phone = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(13, "Phone number too long")
  .regex(/^[+\d][\d\s-]{8,12}$/, "Enter a valid phone number");

const email = z.string().email("Enter a valid email address");

const pincode = z
  .string()
  .length(6, "Pincode must be exactly 6 digits")
  .regex(/^\d{6}$/, "Pincode must be numeric");

const fssai = z
  .string()
  .length(14, "FSSAI licence must be exactly 14 digits")
  .regex(/^\d{14}$/, "FSSAI licence must be numeric");

const gstin = z
  .string()
  .regex(
    /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/,
    "Enter a valid GSTIN (e.g. 29ABCDE1234F1Z5)"
  )
  .optional()
  .or(z.literal(""));

/* ------------------------------------------------------------------ */
/*  Composite schemas                                                 */
/* ------------------------------------------------------------------ */

/** User profile schema */
export const UserProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  phone,
  email: email.optional().or(z.literal("")),
  avatar: z.string().url().optional(),
});

/** Saved delivery address */
export const AddressSchema = z.object({
  id: z.string(),
  label: z.enum(["Home", "Work", "Other"]),
  line1: z.string().min(5, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  pincode,
  lat: z.number().optional(),
  lng: z.number().optional(),
});

/** Payment method */
export const PaymentMethodSchema = z.object({
  id: z.string(),
  type: z.enum(["upi", "card", "cash"]),
  label: z.string().min(1),
  last4: z.string().length(4).optional(),
  default: z.boolean().default(false),
});

/** Dine-in reservation */
export const ReservationSchema = z.object({
  restaurantId: z.string(),
  guests: z.number().int().min(1, "At least 1 guest").max(20, "Max 20 guests"),
  date: z.string().min(1, "Pick a date"),
  slot: z.string().min(1, "Pick a time slot"),
});

/** Restaurant listing (partner onboarding) */
export const RestaurantListingSchema = z.object({
  name: z.string().min(2, "Restaurant name is required").max(80),
  cuisines: z.string().min(2, "Add at least one cuisine"),
  address: z.string().min(10, "Full address is required"),
  fssai,
  gstin,
  seats: z
    .number({ invalid_type_error: "Enter a number" })
    .int()
    .min(0, "Cannot be negative")
    .max(500, "Seems too high — double-check")
    .optional(),
  phone: phone.optional(),
  bankAccount: z.string().optional(),
  ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code")
    .optional()
    .or(z.literal("")),
});

/** Individual menu item */
export const MenuItemSchema = z.object({
  name: z.string().min(2, "Dish name is required").max(80),
  price: z.number().min(1, "Price must be at least ₹1").max(9999),
  category: z.string().min(1, "Category is required"),
  veg: z.boolean(),
  description: z.string().max(200).optional(),
  stock: z
    .number()
    .int()
    .min(0, "Stock cannot be negative")
    .max(999, "Max 999 per day"),
  prepMins: z.number().int().min(1).max(120).optional(),
});

/** Nutrition info per dish */
export const NutritionSchema = z.object({
  servingG: z.number().min(1).max(2000),
  kcal: z.number().min(0).max(5000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  fat: z.number().min(0).max(500),
  fibre: z.number().min(0).max(100),
  sodium: z.number().min(0).max(10),
});

/** Rider onboarding */
export const RiderProfileSchema = z.object({
  name: z.string().min(2, "Name is required").max(60),
  vehicle: z.enum(["cycle", "scooter", "bike"]),
  city: z.string().min(2, "City is required"),
  phone: phone.optional(),
  bankAccount: z.string().optional(),
});

/** Birdy voice query — extracted from speech */
export const BirdyQuerySchema = z.object({
  mood: z.string().optional(),
  budget: z.number().min(0).max(10000).optional(),
  radius: z.number().min(0.5).max(50).optional(),
  dietary: z.enum(["any", "veg", "nonveg", "vegan"]).default("any"),
  keywords: z.array(z.string()).default([]),
});

/** Ad boost campaign for partners */
export const BoostCampaignSchema = z.object({
  restaurantId: z.string(),
  tier: z.enum(["basic", "premium", "featured"]),
  dailyBudget: z
    .number()
    .min(50, "Minimum daily budget is ₹50")
    .max(50000, "Maximum daily budget is ₹50,000"),
  durationDays: z.number().int().min(1).max(90),
  targetAudience: z
    .enum(["all", "new_users", "returning", "high_spenders"])
    .default("all"),
  startDate: z.string().min(1),
});

/* ------------------------------------------------------------------ */
/*  Type exports (inferred from schemas)                              */
/* ------------------------------------------------------------------ */

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Reservation = z.infer<typeof ReservationSchema>;
export type RestaurantListing = z.infer<typeof RestaurantListingSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type NutritionInfo = z.infer<typeof NutritionSchema>;
export type RiderProfileForm = z.infer<typeof RiderProfileSchema>;
export type BirdyQuery = z.infer<typeof BirdyQuerySchema>;
export type BoostCampaign = z.infer<typeof BoostCampaignSchema>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Safely parse a schema — returns { success, data?, errors? } */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

/** Get first error for a field name */
export function fieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  return errors?.[field];
}
