import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export default function OrdersPage() {
  return (
    <ModulePlaceholder
      title="Orders"
      description="Track open tickets, kitchen status, and completed sales across every till."
      bullets={[
        "Live open-order board with table and takeaway filters",
        "Recall / void / reprint receipts",
        "Kitchen status sync (queued → preparing → ready)",
      ]}
    />
  );
}
