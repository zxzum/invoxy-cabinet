export const loyaltyTiers = [
  { label: 'Base', discount: '0%', minSpent: 0 },
  { label: 'Friends', discount: '5%', minSpent: 2500 },
  { label: 'VIP', discount: '10%', minSpent: 5000 },
] as const;

export const loyaltySpent = 3240;

export function getLoyaltyState(spent = loyaltySpent) {
  const currentIndex = loyaltyTiers.reduce(
    (index, tier, tierIndex) => (spent >= tier.minSpent ? tierIndex : index),
    0,
  );
  const current = loyaltyTiers[currentIndex];
  const next = loyaltyTiers[currentIndex + 1];
  const maximum = loyaltyTiers[loyaltyTiers.length - 1].minSpent;

  return {
    spent,
    current,
    currentIndex,
    next,
    remaining: next ? Math.max(0, next.minSpent - spent) : 0,
    overallProgress: Math.min(100, Math.round((spent / maximum) * 100)),
  };
}
