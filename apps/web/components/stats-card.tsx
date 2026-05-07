import { type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * StatsCard — metric display card for the dashboard overview row.
 */
export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  compact = false,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group rounded-2xl border bg-card p-5 shadow-card cursor-default",
        !compact && "hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200",
        compact && "border-border/60 shadow-none p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn(
            "font-bold tracking-tight text-foreground",
            compact ? "text-2xl" : "text-4xl"
          )}>
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium leading-snug",
                trendUp ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {trend}
            </p>
          )}
        </div>

        {Icon && (
          <div className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 transition-all duration-200",
            compact ? "h-9 w-9" : "h-11 w-11",
            !compact && "group-hover:from-primary/30 group-hover:to-primary/10"
          )}>
            <Icon className={cn("text-primary", compact ? "h-4 w-4" : "h-5 w-5")} />
          </div>
        )}
      </div>
    </div>
  );
}

