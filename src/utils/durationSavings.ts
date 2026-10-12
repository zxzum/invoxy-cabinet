/** Compare server prices with the shortest term and explicit undiscounted price; never change checkout. */
export function durationSavings(
  price: number,
  months: number,
  monthlyBase: number,
  originalPrice = price,
) {
  if (!Number.isFinite(price) || price < 0) return { basePrice: 0, saving: 0, discount: 0 };
  const comparison =
    Number.isFinite(monthlyBase * months) && monthlyBase > 0 && months > 0
      ? monthlyBase * months
      : price;
  const basePrice = Math.max(
    price,
    Number.isFinite(originalPrice) ? originalPrice : price,
    comparison,
  );
  const saving = Math.max(0, basePrice - price);
  const discount = basePrice > 0 ? Math.floor((saving / basePrice) * 100 + 1e-7) : 0;
  return { basePrice, saving, discount };
}
