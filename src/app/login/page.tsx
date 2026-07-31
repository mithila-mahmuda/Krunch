import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Sign In — Krunch",
  description: "Staff sign in for the Krunch restaurant till and operations suite.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
