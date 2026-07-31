import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Configure tills, tax, staff roles, printers, and restaurant profile."
      bullets={[
        "Staff PIN login and role permissions",
        "Tax rates, service charge, and currency",
        "Receipt / kitchen printer mapping",
      ]}
    />
  );
}
