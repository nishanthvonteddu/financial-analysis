import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  className?: string;
  status: string;
};

const toneMap: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  paused: "border-amber-200 bg-amber-50 text-amber-700",
};

function formatStatus(status: string) {
  return status
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function StatusBadge({ className, status }: StatusBadgeProps) {
  const normalizedStatus = status.trim().toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        toneMap[normalizedStatus] ?? "border-black/10 bg-white/70 text-black/60",
        className,
      )}
      data-status={normalizedStatus}
    >
      {formatStatus(normalizedStatus)}
    </span>
  );
}
