import { IMAGES, type Dish } from "./catalog";

/**
 * The information aggregators never show you: real portion size, full nutrition,
 * allergens, where the ingredients come from, and how closely the photo matched
 * what people actually received. Derived deterministically per dish so the same
 * dish always reports the same facts.
 */
export type DishDetail = {
  grams: number;
  serves: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  allergens: string[];
  spice: 0 | 1 | 2 | 3;
  sourcing: string;
  realPhotos: string[];
  photoCount: number;
  /** % of diners who said the dish matched its photo. */
  accuracy: number;
  prepMins: number;
};

const ALLERGEN_POOL = ["Gluten", "Dairy", "Nuts", "Soy", "Egg", "Shellfish", "Sesame"];

const SOURCING = [
  "Produce from Kolar farms, delivered same morning",
  "Free-range poultry, no antibiotics, local supplier",
  "Line-caught seafood, cold chain verified",
  "Stone-milled flour from a single Karnataka mill",
  "Grass-fed dairy, small-batch creamery",
  "Single-origin cocoa, direct trade",
];

const PHOTO_POOL = [
  IMAGES.burger2,
  IMAGES.plate,
  IMAGES.pizza2,
  IMAGES.sushi2,
  IMAGES.indian3,
  IMAGES.dessert3,
  IMAGES.noodles3,
  IMAGES.burger5,
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export function dishDetail(dish: Dish): DishDetail {
  const h = hash(dish.id);
  const pick = (n: number, salt: number) => Math.floor((h / (salt * 7 + 1)) % n);

  const grams = 180 + pick(9, 1) * 45;
  const kcal = Math.round((dish.veg ? 1.4 : 2.1) * grams);
  const protein = Math.round((dish.veg ? 0.05 : 0.11) * grams);
  const fat = Math.round((dish.veg ? 0.06 : 0.09) * grams);
  const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);

  const allergens: string[] = [];
  ALLERGEN_POOL.forEach((a, i) => {
    if ((h >> (i + 2)) % 3 === 0) allergens.push(a);
  });
  if (!dish.veg && (h % 4 === 0) && !allergens.includes("Shellfish")) allergens.push("Shellfish");

  const photoCount = 6 + pick(90, 3);
  const start = pick(PHOTO_POOL.length, 5);

  return {
    grams,
    serves: grams > 450 ? 2 : 1,
    kcal,
    protein,
    carbs: Math.max(carbs, 10),
    fat,
    allergens: allergens.slice(0, 3),
    spice: (pick(4, 2) as 0 | 1 | 2 | 3),
    sourcing: SOURCING[pick(SOURCING.length, 4)],
    realPhotos: [0, 1, 2, 3].map((i) => PHOTO_POOL[(start + i) % PHOTO_POOL.length]),
    photoCount,
    accuracy: 88 + pick(11, 6),
    prepMins: 8 + pick(14, 7),
  };
}
