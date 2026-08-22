import type { Product } from "./pos-types";
import { normalizeProductCode } from "./product-code";

export type ProductImageAsset = { uri: string; fileName?: string | null };
export type ProductImageImportPreview = { code: string; uri: string; matchedProductId?: string; productName?: string };

export function productCodeFromImageName(fileName?: string | null, uri?: string) {
  const source = fileName || uri?.split("/").pop() || "";
  const nameWithoutExtension = source.replace(/\.[^.]+$/, "");
  return normalizeProductCode(nameWithoutExtension);
}

export function previewProductImageImport(products: Product[], assets: ProductImageAsset[]) {
  return assets.map((asset) => {
    const code = productCodeFromImageName(asset.fileName, asset.uri);
    const product = products.find((item) => item.code === code);
    return { code, uri: asset.uri, matchedProductId: product?.id, productName: product?.name } satisfies ProductImageImportPreview;
  });
}
