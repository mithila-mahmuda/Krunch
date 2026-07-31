import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function InventoryPage() {
  return (
    <ModulePlaceholder
      title="Inventory"
      description="Stock counts, recipe costing, and low-stock alerts tied to sales."
      bullets={[
        "Ingredient-level stock and waste logging",
        "Recipe costing against menu prices",
        "Supplier orders and delivery receipts",
      ]}
    />
  );
}
