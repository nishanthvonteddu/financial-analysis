export const supportedCurrencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "INR", name: "Indian Rupee" },
] as const;

export function getCurrencyName(currency: string) {
  const normalized = currency.trim().toUpperCase();
  return supportedCurrencies.find((option) => option.code === normalized)?.name ?? normalized;
}
