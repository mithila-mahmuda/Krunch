/** Product id → inventory deductions per unit sold. */
export const PRODUCT_RECIPES: Record<
  string,
  { inventoryId: string; quantity: number }[]
> = {
  americano: [{ inventoryId: "i1", quantity: 0.018 }],
  latte: [
    { inventoryId: "i1", quantity: 0.018 },
    { inventoryId: "i2", quantity: 0.2 },
  ],
  cappuccino: [
    { inventoryId: "i1", quantity: 0.018 },
    { inventoryId: "i2", quantity: 0.15 },
  ],
  burger: [
    { inventoryId: "i4", quantity: 1 },
    { inventoryId: "i8", quantity: 1 },
  ],
  fries: [{ inventoryId: "i5", quantity: 0.2 }],
  "fish-chips": [
    { inventoryId: "i6", quantity: 1 },
    { inventoryId: "i5", quantity: 0.25 },
  ],
  lager: [{ inventoryId: "i7", quantity: 0.568 }],
  ipa: [{ inventoryId: "i7", quantity: 0.568 }],
  cola: [{ inventoryId: "i10", quantity: 0.05 }],
  cheesecake: [{ inventoryId: "i9", quantity: 1 }],
  "classic-bubble": [{ inventoryId: "i3", quantity: 0.2 }],
  "taro-bubble": [{ inventoryId: "i3", quantity: 0.2 }],
};

function recipeProductKey(productId: string): string {
  // Tenant-scoped catalog ids look like `rest_abc:americano`.
  if (productId.startsWith("rest_")) {
    const sep = productId.indexOf(":");
    if (sep > 0) return productId.slice(sep + 1);
  }
  return productId;
}

export function recipeDeductionsForLines(
  lines: { productId: string; quantity: number }[],
): { inventoryId: string; quantity: number }[] {
  const totals = new Map<string, number>();

  for (const line of lines) {
    const recipe = PRODUCT_RECIPES[recipeProductKey(line.productId)];
    if (!recipe) continue;
    for (const step of recipe) {
      totals.set(
        step.inventoryId,
        (totals.get(step.inventoryId) ?? 0) + step.quantity * line.quantity,
      );
    }
  }

  return [...totals.entries()].map(([inventoryId, quantity]) => ({
    inventoryId,
    quantity: Math.round(quantity * 1000) / 1000,
  }));
}
