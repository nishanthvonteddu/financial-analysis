import { cn } from "@/lib/utils";

type CurrencyDisplayProps = {
  className?: string;
  compact?: boolean;
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  showSign?: boolean;
  value: number;
};

export function formatCurrency({
  compact = false,
  currency = "USD",
  locale = "en-US",
  maximumFractionDigits,
  minimumFractionDigits,
  showSign = false,
  value,
}: Omit<CurrencyDisplayProps, "className">) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
    notation: compact ? "compact" : "standard",
    signDisplay: showSign ? "exceptZero" : "auto",
    style: "currency",
  }).format(value);
}

export function CurrencyDisplay(props: CurrencyDisplayProps) {
  const { className, ...formatOptions } = props;

  return <span className={cn(className)}>{formatCurrency(formatOptions)}</span>;
}
