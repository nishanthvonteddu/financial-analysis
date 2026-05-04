import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  className?: string;
  status: string;
};

const toneMap: Record<string, string> = {
  active: "border-black/10 bg-stone text-ink",
  cancelled: "border-red-200 bg-red-50 text-red-700",
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
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        toneMap[normalizedStatus] ?? "border-black/10 bg-white/70 text-black/60",
        className,
      )}
      data-status={normalizedStatus}
    >
      {formatStatus(normalizedStatus)}
    </span>
  );
}
