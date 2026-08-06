import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { RESTAURANTS, type Dish, type Restaurant } from "../data/catalog";

export type CartLine = { dish: Dish; qty: number };

export type Order = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  lines: CartLine[];
  total: number;
  placedAt: number;
  status: "delivered" | "live" | "cancelled";
  /** The delivery time we committed to. Miss it and the credit is automatic. */
  promisedMins: number;
  cutlery: boolean;
  /** Credited back to the customer when we broke the promise. */
  lateCredit?: number;
};

type State = {
  cart: CartLine[];
  cartRestaurantId: string | null;
  favourites: string[];
  orders: Order[];
  address: string;
  cutlery: boolean;
};

type Action =
  | { type: "add"; dish: Dish; restaurantId: string }
  | { type: "remove"; dishId: string }
  | { type: "clear" }
  | { type: "toggleFav"; restaurantId: string }
  | { type: "placeOrder"; order: Order }
  | { type: "completeOrder"; orderId: string }
  | { type: "cancelOrder"; orderId: string }
  | { type: "setAddress"; address: string }
  | { type: "setCutlery"; cutlery: boolean };

const seedRestaurant = RESTAURANTS[3];
const initial: State = {
  cart: [],
  cartRestaurantId: null,
  favourites: ["r3", "r7"],
  orders: [
    {
      id: "TRB-8842",
      restaurantId: seedRestaurant.id,
      restaurantName: seedRestaurant.name,
      lines: [{ dish: seedRestaurant.menu[0], qty: 2 }],
      total: 764,
      placedAt: Date.now() - 1000 * 60 * 60 * 26,
      status: "delivered",
      promisedMins: 27,
      cutlery: false,
    },
    {
      id: "TRB-8710",
      restaurantId: "r1",
      restaurantName: "Monochrome Grill House",
      lines: [{ dish: RESTAURANTS[0].menu[1], qty: 1 }],
      total: 348,
      placedAt: Date.now() - 1000 * 60 * 60 * 96,
      status: "delivered",
      promisedMins: 24,
      cutlery: false,
      lateCredit: 60,
    },
  ],
  address: "42, Ashwood Residency, Indiranagar",
  cutlery: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const differentRestaurant =
        state.cartRestaurantId !== null && state.cartRestaurantId !== action.restaurantId;
      const cart = differentRestaurant ? [] : state.cart;
      const existing = cart.find((l) => l.dish.id === action.dish.id);
      return {
        ...state,
        cartRestaurantId: action.restaurantId,
        cart: existing
          ? cart.map((l) => (l.dish.id === action.dish.id ? { ...l, qty: l.qty + 1 } : l))
          : [...cart, { dish: action.dish, qty: 1 }],
      };
    }
    case "remove": {
      const cart = state.cart
        .map((l) => (l.dish.id === action.dishId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0);
      return { ...state, cart, cartRestaurantId: cart.length ? state.cartRestaurantId : null };
    }
    case "clear":
      return { ...state, cart: [], cartRestaurantId: null };
    case "toggleFav":
      return {
        ...state,
        favourites: state.favourites.includes(action.restaurantId)
          ? state.favourites.filter((f) => f !== action.restaurantId)
          : [...state.favourites, action.restaurantId],
      };
    case "placeOrder":
      return { ...state, orders: [action.order, ...state.orders], cart: [], cartRestaurantId: null };
    case "completeOrder":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: "delivered" as const } : o,
        ),
      };
    case "cancelOrder":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: "cancelled" as const } : o,
        ),
      };
    case "setAddress":
      return { ...state, address: action.address };
    case "setCutlery":
      return { ...state, cutlery: action.cutlery };
    default:
      return state;
  }
}

type Ctx = State & {
  addItem: (dish: Dish, restaurantId: string) => void;
  removeItem: (dishId: string) => void;
  clearCart: () => void;
  toggleFav: (restaurantId: string) => void;
  placeOrder: (order: Order) => void;
  completeOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  setAddress: (address: string) => void;
  setCutlery: (cutlery: boolean) => void;
  qtyOf: (dishId: string) => number;
  itemCount: number;
  subtotal: number;
  cartRestaurant: Restaurant | null;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const value = useMemo<Ctx>(() => {
    const subtotal = state.cart.reduce((s, l) => s + l.dish.price * l.qty, 0);
    return {
      ...state,
      addItem: (dish, restaurantId) => dispatch({ type: "add", dish, restaurantId }),
      removeItem: (dishId) => dispatch({ type: "remove", dishId }),
      clearCart: () => dispatch({ type: "clear" }),
      toggleFav: (restaurantId) => dispatch({ type: "toggleFav", restaurantId }),
      placeOrder: (order) => dispatch({ type: "placeOrder", order }),
      completeOrder: (orderId) => dispatch({ type: "completeOrder", orderId }),
      cancelOrder: (orderId) => dispatch({ type: "cancelOrder", orderId }),
      setAddress: (address) => dispatch({ type: "setAddress", address }),
      setCutlery: (cutlery) => dispatch({ type: "setCutlery", cutlery }),
      qtyOf: (dishId) => state.cart.find((l) => l.dish.id === dishId)?.qty ?? 0,
      itemCount: state.cart.reduce((s, l) => s + l.qty, 0),
      subtotal,
      cartRestaurant: RESTAURANTS.find((r) => r.id === state.cartRestaurantId) ?? null,
    };
  }, [state]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Aggregators load ~38% onto a restaurant's own menu price via commission,
 * platform fees and packaging markup. Trubit charges the restaurant nothing,
 * so we show what the same dish costs elsewhere alongside the honest price.
 */
export const MARKUP = 0.38;

export const listedElsewhere = (price: number) => Math.round((price * (1 + MARKUP)) / 5) * 5;

export const savingsOn = (price: number) => listedElsewhere(price) - price;
