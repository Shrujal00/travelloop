export type PackingCategory = "clothing" | "documents" | "toiletries" | "electronics" | "other";

export const PACKING_CATEGORY_LABELS: Record<PackingCategory, string> = {
  clothing: "Clothing",
  documents: "Documents",
  toiletries: "Toiletries",
  electronics: "Electronics",
  other: "Other",
};

/** Stable section order in the checklist UI */
export const PACKING_CATEGORY_ORDER: PackingCategory[] = [
  "documents",
  "clothing",
  "toiletries",
  "electronics",
  "other",
];
