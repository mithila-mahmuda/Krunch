import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function KitchenPage() {
  return (
    <ModulePlaceholder
      title="Kitchen Display"
      description="A bump-screen view for chefs to see tickets the moment they are sent from POS."
      bullets={[
        "Course and station routing",
        "Elapsed-time colour alerts",
        "Bump / recall actions with realtime updates",
      ]}
    />
  );
}
