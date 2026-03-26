import { type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState — polished placeholder for lists and sections with no content.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed",
        "bg-gradient-to-b from-muted/40 to-muted/10 px-8 py-16 text-center",
        "hover:border-primary/30 transition-colors duration-200",
        className
      )}
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/10 shadow-glow-sm">
          <Icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description && (
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
