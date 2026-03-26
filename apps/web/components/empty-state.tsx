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
 * Accepts an optional Lucide icon, title, description, and CTA action slot.
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
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-muted/30 px-8 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description && (
          <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
