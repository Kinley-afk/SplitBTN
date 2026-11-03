// Expense categories and their icons (Ionicons names).
export const CATEGORIES = [
  { key: 'Food', icon: 'restaurant' },
  { key: 'Groceries', icon: 'cart' },
  { key: 'Rent', icon: 'home' },
  { key: 'Utilities', icon: 'flash' },
  { key: 'Transport', icon: 'bus' },
  { key: 'Entertainment', icon: 'film' },
  { key: 'Shopping', icon: 'bag' },
  { key: 'Health', icon: 'medkit' },
  { key: 'Other', icon: 'ellipsis-horizontal-circle' },
];

export function getCategoryIcon(key) {
  const found = CATEGORIES.find((category) => category.key === key);
  return found ? found.icon : 'ellipsis-horizontal-circle';
}