import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export function LoadingSpinner({
  className,
  label,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <span
      aria-live="polite"
      className={cn("inline-flex items-center gap-3 text-sm text-black/60", className)}
      role="status"
    >
      <svg
        aria-hidden="true"
        className={cn("animate-spin text-ember", sizeClasses[size])}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
        <path
          className="opacity-100"
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}
