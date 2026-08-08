import type { CSSProperties } from "react";
import {
  normalizeCategoryColor,
  resolveCategoryColor,
} from "@/lib/category-color";
import type { Category, Product } from "@/lib/types";

type TileSurfaceInput = {
  color: string;
  imageDataUrl?: string | null;
};

/** Solid colour, or photo with a light scrim so white labels stay readable. */
export function tileSurfaceStyle(input: TileSurfaceInput): CSSProperties {
  const image = input.imageDataUrl?.trim();
  if (!image) {
    return { backgroundColor: input.color };
  }
  return {
    backgroundColor: input.color,
    backgroundImage: `linear-gradient(rgb(15 23 42 / 0.18), rgb(15 23 42 / 0.28)), url(${JSON.stringify(image)})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function resolveProductTileColor(
  product: Pick<Product, "color"> | null | undefined,
  category: Pick<Category, "color" | "tone"> | null | undefined,
): string {
  const fromProduct = product?.color
    ? normalizeCategoryColor(product.color)
    : null;
  return fromProduct ?? resolveCategoryColor(category);
}

export function categoryTileStyle(
  category: Pick<Category, "color" | "tone" | "imageDataUrl"> | null | undefined,
): CSSProperties {
  return tileSurfaceStyle({
    color: resolveCategoryColor(category),
    imageDataUrl: category?.imageDataUrl,
  });
}

export function productTileStyle(
  product: Pick<Product, "color" | "imageDataUrl"> | null | undefined,
  category: Pick<Category, "color" | "tone" | "imageDataUrl"> | null | undefined,
): CSSProperties {
  return tileSurfaceStyle({
    color: resolveProductTileColor(product, category),
    imageDataUrl: product?.imageDataUrl || category?.imageDataUrl,
  });
}
