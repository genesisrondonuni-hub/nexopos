export function normalizeCategoryName(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= 40 ? normalized : null;
}

export function hasCategoryName(categories: string[], candidate: string, except?: string) {
  return categories.some((category) => category !== except && category.toLocaleLowerCase() === candidate.toLocaleLowerCase());
}

export function canRemoveCategory(categories: string[], name: string) {
  return categories.length > 1 && categories.includes(name);
}
