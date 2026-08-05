import {
  parseReceipt,
  renderPlainReceiptDocumentHtml,
  renderReceiptDocumentHtml,
} from "@/lib/receipt";

/** Open a focused print window for a till receipt (browser print dialog). */
export function printReceiptText(receipt: string): boolean {
  if (typeof window === "undefined") return false;

  const printWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=420,height=720",
  );

  if (!printWindow) return false;

  const data = parseReceipt(receipt);
  const documentHtml = data
    ? renderReceiptDocumentHtml(data)
    : renderPlainReceiptDocumentHtml(receipt);

  printWindow.document.write(documentHtml);
  printWindow.document.close();
  return true;
}
