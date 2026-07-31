import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function TablesPage() {
  return (
    <ModulePlaceholder
      title="Tabs & Tables"
      description="Floor plan and open-tab management for dine-in service."
      bullets={[
        "Visual floor plan with occupied / available states",
        "Split bills and move covers between tables",
        "Server section assignment",
      ]}
    />
  );
}
