export type Nutrition = {
  servingG: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sodiumMg: number;
};

export type Dish = {
  id: string;
  name: string;
  desc: string;
  price: number;
  veg: boolean;
  bestseller?: boolean;
  image: string;
  category: string;
  /** Every angle the kitchen uploaded. `image` is always angles[0]. */
  angles: string[];
  /** Units the kitchen can actually cook today. The hard ceiling. */
  stock: number;
  nutrition: Nutrition;
  allergens: string[];
  spice: 0 | 1 | 2 | 3;
  prepMins: number;
};

/** What a kitchen types into the listing form. Everything here reaches the diner. */
export type DishDraft = Omit<Dish, "id" | "angles"> & { angles: string[] };

export type Restaurant = {
  id: string;
  name: string;
  cuisines: string[];
  rating: number;
  ratingCount: string;
  etaMins: number;
  distanceKm: number;
  priceForTwo: number;
  image: string;
  cover: string;
  offer?: string;
  promoted?: boolean;
  pureVeg?: boolean;
  /** Latitude / longitude for the map and for radius search. */
  lat: number;
  lng: number;
  /** Seats bookable for dine-in, or 0 if delivery only. */
  seats: number;
  /** Percentage off the bill when you eat in — no delivery cost to fund. */
  dineInOff: number;
  menu: Dish[];
};

export const IMAGES = {
  burger1:
    "https://images.unsplash.com/photo-1761315413256-e149b40f577b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  burger2:
    "https://images.unsplash.com/photo-1761315413695-5dcd5c318b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  burger3:
    "https://images.unsplash.com/photo-1761315413686-8467379d8715?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  burger4:
    "https://images.unsplash.com/photo-1761315412811-4525e421e00b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  burger5:
    "https://images.unsplash.com/photo-1651993841930-946a700c1524?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  plate:
    "https://images.unsplash.com/photo-1692197275931-0793e08efcc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  pizza1:
    "https://images.unsplash.com/photo-1621510564330-c87695020b53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  pizza2:
    "https://images.unsplash.com/photo-1669717879542-65eb286d1b23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  sushi1:
    "https://images.unsplash.com/photo-1666307534071-3c794b101c82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  sushi2:
    "https://images.unsplash.com/photo-1785502108468-9bc43aa6d83e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  sushi3:
    "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  indian1:
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  indian2:
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  indian3:
    "https://images.unsplash.com/photo-1716550781939-beb7d7247aae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  dessert1:
    "https://images.unsplash.com/photo-1740594967618-23cd757b9291?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  dessert2:
    "https://images.unsplash.com/photo-1759524322924-2024f209a011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  dessert3:
    "https://images.unsplash.com/photo-1758652561808-a0d9337fd57a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  interior1:
    "https://images.unsplash.com/photo-1583354608715-177553a4035e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  interior2:
    "https://images.unsplash.com/photo-1709548145082-04d0cde481d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  interior3:
    "https://images.unsplash.com/photo-1570560258879-af7f8e1447ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  noodles1:
    "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  noodles2:
    "https://images.unsplash.com/photo-1612927601601-6638404737ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  noodles3:
    "https://images.unsplash.com/photo-1784378578794-f973c7ad4a86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
};

export const CATEGORIES = [
  { id: "burger", label: "Burgers", image: IMAGES.burger4 },
  { id: "pizza", label: "Pizza", image: IMAGES.pizza2 },
  { id: "sushi", label: "Sushi", image: IMAGES.sushi1 },
  { id: "indian", label: "Biryani", image: IMAGES.indian1 },
  { id: "noodles", label: "Noodles", image: IMAGES.noodles2 },
  { id: "dessert", label: "Desserts", image: IMAGES.dessert2 },
  { id: "healthy", label: "Healthy", image: IMAGES.dessert3 },
  { id: "cafe", label: "Café", image: IMAGES.interior2 },
];

type RawDish = Pick<
  Dish,
  "id" | "name" | "desc" | "price" | "veg" | "image" | "category" | "bestseller"
>;
type RawRestaurant = Omit<Restaurant, "menu" | "lat" | "lng" | "seats" | "dineInOff"> & {
  menu: RawDish[];
};

const d = (
  id: string,
  name: string,
  desc: string,
  price: number,
  veg: boolean,
  image: string,
  category: string,
  bestseller = false,
): RawDish => ({ id, name, desc, price, veg, image, category, bestseller });

const RAW: RawRestaurant[] = [
  {
    id: "r1",
    name: "Monochrome Grill House",
    cuisines: ["American", "Burgers", "Grill"],
    rating: 4.7,
    ratingCount: "12.4K",
    etaMins: 24,
    distanceKm: 1.8,
    priceForTwo: 650,
    image: IMAGES.burger1,
    cover: IMAGES.burger3,
    offer: "50% OFF up to ₹120",
    promoted: true,
    menu: [
      d("r1m1", "Truffle Smash Burger", "Double patty, aged cheddar, truffle aioli, brioche", 349, false, IMAGES.burger1, "Bestsellers", true),
      d("r1m2", "Classic Double Stack", "Two beef patties, pickles, house sauce", 299, false, IMAGES.burger2, "Bestsellers", true),
      d("r1m3", "Smoked Brisket Burger", "12-hour smoked brisket, slaw, chipotle mayo", 379, false, IMAGES.burger4, "Burgers"),
      d("r1m4", "Garden Mushroom Burger", "Portobello, swiss, rocket, garlic aioli", 279, true, IMAGES.burger5, "Burgers"),
      d("r1m5", "Loaded Chilli Fries", "Crispy fries, cheese sauce, jalapeños", 189, true, IMAGES.plate, "Sides"),
      d("r1m6", "Dark Chocolate Shake", "Belgian cocoa, vanilla bean cream", 199, true, IMAGES.dessert2, "Desserts"),
    ],
  },
  {
    id: "r2",
    name: "Noir Napoli Pizzeria",
    cuisines: ["Italian", "Pizza", "Pasta"],
    rating: 4.6,
    ratingCount: "9.1K",
    etaMins: 31,
    distanceKm: 2.6,
    priceForTwo: 700,
    image: IMAGES.pizza1,
    cover: IMAGES.pizza2,
    offer: "Flat ₹150 OFF above ₹499",
    menu: [
      d("r2m1", "Margherita Bianca", "San Marzano, fior di latte, basil", 399, true, IMAGES.pizza1, "Bestsellers", true),
      d("r2m2", "Truffle Funghi", "Wild mushroom, truffle cream, parmesan", 549, true, IMAGES.pizza2, "Bestsellers", true),
      d("r2m3", "Diavola Piccante", "Spicy salami, chilli honey, mozzarella", 599, false, IMAGES.pizza1, "Pizza"),
      d("r2m4", "Cacio e Pepe", "Pecorino, cracked black pepper, tonnarelli", 449, true, IMAGES.noodles1, "Pasta"),
      d("r2m5", "Tiramisu Classico", "Mascarpone, espresso, cocoa dust", 249, true, IMAGES.dessert1, "Desserts"),
    ],
  },
  {
    id: "r3",
    name: "Shiro Sushi Atelier",
    cuisines: ["Japanese", "Sushi", "Asian"],
    rating: 4.8,
    ratingCount: "6.7K",
    etaMins: 38,
    distanceKm: 4.1,
    priceForTwo: 1400,
    image: IMAGES.sushi1,
    cover: IMAGES.sushi3,
    offer: "Free Miso Soup on ₹899",
    promoted: true,
    menu: [
      d("r3m1", "Omakase Nigiri Set", "Chef's selection, 10 pieces", 1290, false, IMAGES.sushi1, "Bestsellers", true),
      d("r3m2", "Wagyu Truffle Roll", "Seared wagyu, avocado, truffle shoyu", 890, false, IMAGES.sushi2, "Bestsellers", true),
      d("r3m3", "Dragon Uramaki", "Prawn tempura, eel glaze, tobiko", 690, false, IMAGES.sushi3, "Rolls"),
      d("r3m4", "Avocado Garden Roll", "Avocado, cucumber, sesame, yuzu", 490, true, IMAGES.sushi3, "Rolls"),
      d("r3m5", "Tonkotsu Ramen", "24-hour pork broth, chashu, ajitama", 590, false, IMAGES.noodles3, "Ramen"),
    ],
  },
  {
    id: "r4",
    name: "Ivory Spice Kitchen",
    cuisines: ["North Indian", "Biryani", "Mughlai"],
    rating: 4.5,
    ratingCount: "21.8K",
    etaMins: 27,
    distanceKm: 2.2,
    priceForTwo: 500,
    image: IMAGES.indian1,
    cover: IMAGES.indian2,
    offer: "Buy 1 Get 1 on Biryani",
    menu: [
      d("r4m1", "Hyderabadi Dum Biryani", "Basmati, saffron, slow-cooked chicken", 349, false, IMAGES.indian1, "Bestsellers", true),
      d("r4m2", "Paneer Tikka Masala", "Charred paneer, tomato cream gravy", 299, true, IMAGES.indian2, "Bestsellers", true),
      d("r4m3", "Lamb Rogan Josh", "Kashmiri chillies, yoghurt, whole spices", 429, false, IMAGES.indian3, "Mains"),
      d("r4m4", "Dal Makhani", "Black lentils, 8 hours, white butter", 249, true, IMAGES.indian2, "Mains"),
      d("r4m5", "Gulab Jamun", "Warm, cardamom syrup, two pieces", 129, true, IMAGES.dessert1, "Desserts"),
    ],
  },
  {
    id: "r5",
    name: "The Ash & Ember Café",
    cuisines: ["Café", "Continental", "Bakery"],
    rating: 4.4,
    ratingCount: "4.3K",
    etaMins: 19,
    distanceKm: 1.1,
    priceForTwo: 450,
    image: IMAGES.interior2,
    cover: IMAGES.interior3,
    offer: "20% OFF all day",
    pureVeg: true,
    menu: [
      d("r5m1", "Burnt Basque Cheesecake", "Caramelised top, vanilla bean", 289, true, IMAGES.dessert1, "Bestsellers", true),
      d("r5m2", "Cold Brew Tonic", "48-hour cold brew, citrus tonic", 219, true, IMAGES.dessert3, "Bestsellers", true),
      d("r5m3", "Truffle Mushroom Toast", "Sourdough, wild mushroom, parmesan", 329, true, IMAGES.plate, "All Day"),
      d("r5m4", "Berry Bowl", "Seasonal berries, greek yoghurt, granola", 269, true, IMAGES.dessert3, "Healthy"),
    ],
  },
  {
    id: "r6",
    name: "Midnight Wok",
    cuisines: ["Chinese", "Thai", "Noodles"],
    rating: 4.3,
    ratingCount: "8.9K",
    etaMins: 33,
    distanceKm: 3.4,
    priceForTwo: 550,
    image: IMAGES.noodles2,
    cover: IMAGES.noodles1,
    offer: "Free delivery",
    menu: [
      d("r6m1", "Black Pepper Hakka Noodles", "Wok-tossed, crushed pepper, spring onion", 289, true, IMAGES.noodles2, "Bestsellers", true),
      d("r6m2", "Chilli Garlic Ramen", "Hand-pulled noodles, chilli oil", 339, false, IMAGES.noodles3, "Bestsellers", true),
      d("r6m3", "Thai Basil Fried Rice", "Jasmine rice, holy basil, bird's eye chilli", 299, true, IMAGES.noodles1, "Rice"),
      d("r6m4", "Crispy Chilli Chicken", "Double fried, sweet-heat glaze", 359, false, IMAGES.plate, "Starters"),
    ],
  },
  {
    id: "r7",
    name: "Blanc Patisserie",
    cuisines: ["Desserts", "Bakery", "Coffee"],
    rating: 4.9,
    ratingCount: "3.2K",
    etaMins: 22,
    distanceKm: 1.5,
    priceForTwo: 400,
    image: IMAGES.dessert2,
    cover: IMAGES.dessert1,
    offer: "₹100 OFF above ₹399",
    pureVeg: true,
    menu: [
      d("r7m1", "Valrhona Chocolate Cupcake", "70% dark ganache, sea salt", 189, true, IMAGES.dessert2, "Bestsellers", true),
      d("r7m2", "Vanilla Bean Cheesecake", "Madagascan vanilla, biscuit base", 249, true, IMAGES.dessert1, "Bestsellers", true),
      d("r7m3", "Wild Berry Pavlova", "Meringue, cream, fresh berries", 279, true, IMAGES.dessert3, "Cakes"),
    ],
  },
  {
    id: "r8",
    name: "Carbon Steakhouse",
    cuisines: ["Steak", "Grill", "European"],
    rating: 4.6,
    ratingCount: "5.5K",
    etaMins: 42,
    distanceKm: 5.2,
    priceForTwo: 1800,
    image: IMAGES.plate,
    cover: IMAGES.interior1,
    offer: "Chef's tasting menu live",
    menu: [
      d("r8m1", "Dry-Aged Ribeye 300g", "45-day aged, bone marrow butter", 1890, false, IMAGES.plate, "Bestsellers", true),
      d("r8m2", "Charred Cauliflower Steak", "Tahini, pomegranate, dukkah", 690, true, IMAGES.plate, "Bestsellers", true),
      d("r8m3", "Truffle Pomme Purée", "Yukon gold, black truffle", 390, true, IMAGES.plate, "Sides"),
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Enrichment
 *
 * The raw list above is the editorial content. Everything a kitchen would
 * actually type into the listing form — nutrition, allergens, prep time,
 * how many units they can cook today, the extra camera angles — is derived
 * deterministically from the dish id so a dish always reports the same
 * facts, and is then editable by the partner in their own app.
 * ------------------------------------------------------------------ */

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const ANGLE_POOL: Record<string, string[]> = {
  burger: [IMAGES.burger1, IMAGES.burger2, IMAGES.burger3, IMAGES.burger4, IMAGES.burger5],
  pizza: [IMAGES.pizza1, IMAGES.pizza2, IMAGES.plate],
  sushi: [IMAGES.sushi1, IMAGES.sushi2, IMAGES.sushi3],
  indian: [IMAGES.indian1, IMAGES.indian2, IMAGES.indian3],
  noodles: [IMAGES.noodles1, IMAGES.noodles2, IMAGES.noodles3],
  dessert: [IMAGES.dessert1, IMAGES.dessert2, IMAGES.dessert3],
  plate: [IMAGES.plate, IMAGES.interior1, IMAGES.burger3],
};

const poolFor = (image: string) => {
  const key = Object.keys(ANGLE_POOL).find((k) => ANGLE_POOL[k].includes(image));
  return key ? ANGLE_POOL[key] : ANGLE_POOL.plate;
};

const ALLERGEN_SETS = [
  ["Gluten", "Dairy"],
  ["Dairy"],
  ["Gluten", "Egg", "Sesame"],
  ["Soy", "Gluten"],
  ["Nuts", "Dairy"],
  ["Fish", "Soy"],
  [],
];

function nutritionFor(dish: RawDish): Nutrition {
  const h = hash(dish.id);
  const servingG = 180 + (h % 9) * 30;
  const density = dish.veg ? 1.35 : 1.85;
  const kcal = Math.round((servingG * density) / 5) * 5;
  const protein = Math.round((kcal * (dish.veg ? 0.11 : 0.2)) / 4);
  const fat = Math.round((kcal * (0.28 + ((h >> 3) % 8) / 100)) / 9);
  const carbs = Math.max(4, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {
    servingG,
    kcal,
    protein,
    carbs,
    fat,
    fibre: 1 + ((h >> 5) % 7),
    sodiumMg: 280 + ((h >> 7) % 14) * 60,
  };
}

/** A kitchen can only cook so many of a thing before the prep runs out. */
function stockFor(dish: RawDish) {
  const h = hash(dish.id + "stock");
  // Signature and premium dishes are genuinely scarce; sides are not.
  if (dish.price > 800) return 2 + (h % 3);
  if (dish.bestseller) return 4 + (h % 5);
  return 9 + (h % 22);
}

function enrichDish(dish: RawDish): Dish {
  const h = hash(dish.id);
  const pool = poolFor(dish.image);
  const rest = pool.filter((p) => p !== dish.image);
  const angles = [dish.image, ...rest.slice(0, 2 + (h % 2))];
  return {
    ...dish,
    angles,
    stock: stockFor(dish),
    nutrition: nutritionFor(dish),
    allergens: ALLERGEN_SETS[h % ALLERGEN_SETS.length],
    spice: (dish.veg ? h % 3 : (h % 4)) as 0 | 1 | 2 | 3,
    prepMins: 8 + (h % 18),
  };
}

/** Where each kitchen sits. Centred on Indiranagar, Bengaluru. */
export const CITY = { lat: 12.9784, lng: 77.6408 };

const PLACES: Record<string, { lat: number; lng: number; seats: number; dineInOff: number }> = {
  r1: { lat: 12.9718, lng: 77.6412, seats: 48, dineInOff: 15 },
  r2: { lat: 12.9852, lng: 77.6301, seats: 36, dineInOff: 12 },
  r3: { lat: 12.9611, lng: 77.6668, seats: 24, dineInOff: 10 },
  r4: { lat: 12.9889, lng: 77.6489, seats: 62, dineInOff: 18 },
  r5: { lat: 12.9761, lng: 77.6355, seats: 30, dineInOff: 20 },
  r6: { lat: 12.9942, lng: 77.6702, seats: 0, dineInOff: 0 },
  r7: { lat: 12.9705, lng: 77.6288, seats: 14, dineInOff: 10 },
  r8: { lat: 13.0056, lng: 77.6801, seats: 40, dineInOff: 8 },
};

export const RESTAURANTS: Restaurant[] = RAW.map((r) => ({
  ...r,
  ...PLACES[r.id],
  menu: r.menu.map(enrichDish),
}));

/** Straight-line distance in km — good enough for a radius filter. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10;
}

export const COLLECTIONS = [
  { id: "c1", title: "Late Night\nCravings", sub: "Open till 4 AM", image: IMAGES.noodles3 },
  { id: "c2", title: "Chef's\nSpecials", sub: "Curated tasting menus", image: IMAGES.interior1 },
  { id: "c3", title: "Under\n30 Minutes", sub: "Lightning fast", image: IMAGES.burger2 },
  { id: "c4", title: "Sweet\nEndings", sub: "Desserts & bakes", image: IMAGES.dessert1 },
];

export const ALL_DISHES: (Dish & { restaurantId: string; restaurantName: string })[] =
  RESTAURANTS.flatMap((r) =>
    r.menu.map((m) => ({ ...m, restaurantId: r.id, restaurantName: r.name })),
  );

export const CATEGORY_MATCH: Record<string, string[]> = {
  burger: ["r1"],
  pizza: ["r2"],
  sushi: ["r3"],
  indian: ["r4"],
  noodles: ["r6", "r3"],
  dessert: ["r7", "r5"],
  healthy: ["r5", "r8"],
  cafe: ["r5", "r7"],
};
