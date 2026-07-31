import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="End-of-day, product mix, labour, and tax reports for the business."
      bullets={[
        "Z-report / X-report and till reconciliation",
        "Sales by hour, category, and server",
        "Export to CSV / accounting tools",
      ]}
    />
  );
}
