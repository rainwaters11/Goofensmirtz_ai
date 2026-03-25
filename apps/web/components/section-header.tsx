import { cn } from "../lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Optional element placed at the end (e.g. a button or badge) */
  action?: React.ReactNode;
  className?: string;
}

/**
 * SectionHeader — consistent heading row used throughout the dashboard.
 * Handles title, optional subtitle, and an optional trailing action slot.
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
