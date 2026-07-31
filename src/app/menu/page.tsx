import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function MenuPage() {
  return (
    <ModulePlaceholder
      title="Menu Manager"
      description="Build categories, products, modifiers, and promotions that power the till."
      bullets={[
        "Category colours and touch-tile layout",
        "Modifiers, variants, and 86 / out-of-stock flags",
        "Happy-hour and multi-buy promotions",
      ]}
    />
  );
}
