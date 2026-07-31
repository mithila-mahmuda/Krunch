import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function CustomersPage() {
  return (
    <ModulePlaceholder
      title="Customers"
      description="Guest profiles, visit history, and loyalty for faster repeat service."
      bullets={[
        "Quick search by name or phone",
        "Allergens and preferences on the ticket",
        "Loyalty points and stored payment methods",
      ]}
    />
  );
}
