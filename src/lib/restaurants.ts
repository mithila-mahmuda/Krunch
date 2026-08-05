"use client";

import {
  loadAllStaffUsers,
  loadRestaurantAccounts,
  saveRestaurantAccounts,
  type RestaurantAccountRow,
} from "@/lib/db/repos";
import { queueDbWrite } from "@/lib/db/write";

export interface RestaurantAccount {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  contactNumber: string;
  password: string;
  createdAt: string;
}

let cachedAccounts: RestaurantAccount[] = [];
let cacheReady = false;

export async function hydrateRestaurantAccounts(): Promise<void> {
  const rows = await loadRestaurantAccounts();
  cachedAccounts = rows.map(toAccount);
  cacheReady = true;
}

export function readRestaurantAccounts(): RestaurantAccount[] {
  return cacheReady ? cachedAccounts : [];
}

function writeRestaurantAccounts(accounts: RestaurantAccount[]) {
  cachedAccounts = accounts;
  cacheReady = true;
  queueDbWrite(
    () => saveRestaurantAccounts(accounts.map(toRow)),
    "save restaurants",
  );
}

function toAccount(row: RestaurantAccountRow): RestaurantAccount {
  return {
    id: row.id,
    restaurantName: row.restaurantName,
    ownerName: row.ownerName,
    email: row.email,
    contactNumber: row.contactNumber,
    password: row.password,
    createdAt: row.createdAt,
  };
}

function toRow(account: RestaurantAccount): RestaurantAccountRow {
  return {
    id: account.id,
    restaurantName: account.restaurantName,
    ownerName: account.ownerName,
    email: account.email,
    contactNumber: account.contactNumber,
    password: account.password,
    createdAt: account.createdAt,
  };
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

export async function createRestaurantAccount(input: {
  restaurantName: string;
  ownerName: string;
  email: string;
  contactNumber: string;
  password: string;
}): Promise<
  { ok: true; account: RestaurantAccount } | { ok: false; error: string }
> {
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

  const allStaff = await loadAllStaffUsers();
  const emailTakenByStaff = allStaff.some(
    (staff) => !staff.archived && staff.email === email,
  );
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

  writeRestaurantAccounts([...readRestaurantAccounts(), account]);
  return { ok: true, account };
}
