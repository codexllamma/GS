const SIZE_ORDER = ["S", "M", "L", "XL"];

export function sortVariants<T extends { size: string }>(variants: T[]): T[] {
  if (!variants || !Array.isArray(variants)) return [];

  return [...variants].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.size?.trim().toUpperCase());
    const indexB = SIZE_ORDER.indexOf(b.size?.trim().toUpperCase());

    // If size is not found in SIZE_ORDER, push it to the end
    const rankA = indexA === -1 ? 999 : indexA;
    const rankB = indexB === -1 ? 999 : indexB;

    return rankA - rankB;
  });
}