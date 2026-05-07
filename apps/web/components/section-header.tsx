import { cn } from "../lib/utils";

type SectionHeaderVariant = "default" | "page";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: SectionHeaderVariant;
}

/**
 * SectionHeader — consistent heading row used throughout the dashboard.
 * variant="page" renders a larger, bolder heading for top-level page titles.
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
  variant = "default",
}: SectionHeaderProps) {
  const isPage = variant === "page";

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className={cn("flex flex-col", isPage ? "gap-1" : "gap-0.5")}>
        <h2
          className={cn(
            "font-bold tracking-tight text-foreground",
            isPage ? "text-2xl sm:text-3xl" : "text-lg font-semibold"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "text-muted-foreground leading-relaxed",
              isPage ? "text-base" : "text-sm"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
