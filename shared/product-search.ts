import type { Product } from "./pos-types";
import { normalizeProductCode } from "./product-code";

export function searchProducts(products: Product[], query: string) {
  const rawQuery = query.trim().toLocaleLowerCase();
  if (!rawQuery) return products;
  const codeQuery = normalizeProductCode(query);
  return products.filter((product) => product.code.includes(codeQuery) || [product.name, product.description, product.category].some((value) => value.toLocaleLowerCase().includes(rawQuery)));
}

export function findProductByCode(products: Product[], code: string) {
  const normalized = normalizeProductCode(code);
  return products.find((product) => product.code === normalized) ?? null;
}
