import { DEMO_STAFF } from "@/lib/staff";

export interface RestaurantAccount {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  contactNumber: string;
  password: string;
  createdAt: string;
}

const STORAGE_KEY = "krunch-restaurants";

export function readRestaurantAccounts(): RestaurantAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RestaurantAccount[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (account) =>
        account?.id &&
        account?.restaurantName &&
        account?.ownerName &&
        account?.email &&
        account?.contactNumber &&
        account?.password,
    );
  } catch {
    return [];
  }
}

function writeRestaurantAccounts(accounts: RestaurantAccount[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function findRestaurantByEmail(email: string): RestaurantAccount | null {
  const normalized = email.trim().toLowerCase();
  return (
    readRestaurantAccounts().find(
      (account) => account.email === normalized,
    ) ?? null
  );
}

export function findRestaurantByCredentials(
  email: string,
  password: string,
): RestaurantAccount | null {
  const account = findRestaurantByEmail(email);
  if (!account || account.password !== password) return null;
  return account;
}

export function createRestaurantAccount(input: {
  restaurantName: string;
  ownerName: string;
  email: string;
  contactNumber: string;
  password: string;
}): { ok: true; account: RestaurantAccount } | { ok: false; error: string } {
  const restaurantName = input.restaurantName.trim();
  const ownerName = input.ownerName.trim();
  const email = input.email.trim().toLowerCase();
  const contactNumber = input.contactNumber.trim();
  const password = input.password;
  const digitsOnly = contactNumber.replace(/\D/g, "");

  if (restaurantName.length < 2) {
    return { ok: false, error: "Enter your restaurant name." };
  }

  if (ownerName.length < 2) {
    return { ok: false, error: "Enter your name." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { ok: false, error: "Enter a valid contact number." };
  }

  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const emailTakenByStaff = DEMO_STAFF.some((staff) => staff.email === email);
  if (emailTakenByStaff || findRestaurantByEmail(email)) {
    return {
      ok: false,
      error: "An account with this email already exists. Sign in instead.",
    };
  }

  const account: RestaurantAccount = {
    id: `rest_${Date.now().toString(36)}`,
    restaurantName,
    ownerName,
    email,
    contactNumber,
    password,
    createdAt: new Date().toISOString(),
  };

  const accounts = readRestaurantAccounts();
  writeRestaurantAccounts([...accounts, account]);
  return { ok: true, account };
}
