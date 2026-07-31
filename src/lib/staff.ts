export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "manager" | "cashier" | "server";
  pin: string;
  password: string;
}

export const DEMO_STAFF: StaffUser[] = [
  {
    id: "kyle",
    name: "Kyle",
    email: "kyle@krunch.app",
    role: "manager",
    pin: "1234",
    password: "till1234",
  },
  {
    id: "maya",
    name: "Maya",
    email: "maya@krunch.app",
    role: "cashier",
    pin: "5678",
    password: "till5678",
  },
  {
    id: "sam",
    name: "Sam",
    email: "sam@krunch.app",
    role: "server",
    pin: "9012",
    password: "till9012",
  },
];

export function findStaffByCredentials(
  email: string,
  password: string,
): StaffUser | null {
  const normalized = email.trim().toLowerCase();
  return (
    DEMO_STAFF.find(
      (staff) =>
        staff.email === normalized && staff.password === password,
    ) ?? null
  );
}
