import type { Metadata } from "next";
import { SignupScreen } from "@/components/auth/SignupScreen";

export const metadata: Metadata = {
  title: "Sign Up — Krunch",
  description:
    "Create a restaurant account on Krunch for POS, kitchen, tables, and reporting.",
};

export default function SignupPage() {
  return <SignupScreen />;
}
