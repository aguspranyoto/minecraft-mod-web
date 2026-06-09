import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "premium" | "free" | "outline";
}) {
  const variants: Record<string, string> = {
    default: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    secondary: "bg-neutral-800 text-neutral-300 border-neutral-700",
    premium:
      "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    free: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    outline: "bg-transparent text-neutral-300 border-neutral-600",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
