import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";

type StepStatus = "pending" | "running" | "complete" | "failed";

interface PipelineStep {
  label: string;
  status: StepStatus;
  detail?: string;
}

interface ProcessingStatusCardProps {
  steps: PipelineStep[];
  className?: string;
}

/**
 * ProcessingStatusCard — vertical pipeline progress tracker.
 * Shows each pipeline step with its status icon and optional detail text.
 *
 * Used in the project detail page to surface real-time job progress.
 * TODO: Wire to live job status from GET /api/projects/:id/jobs.
 */
export function ProcessingStatusCard({
  steps,
  className,
}: ProcessingStatusCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-card",
        className
      )}
    >
      <p className="mb-4 text-sm font-semibold text-foreground">
        Pipeline progress
      </p>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <StepIcon status={step.status} />

            <div className="flex flex-col gap-0.5 pt-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  step.status === "complete"
                    ? "text-foreground"
                    : step.status === "failed"
                      ? "text-destructive"
                      : step.status === "running"
                        ? "text-foreground"
                        : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.detail && (
                <span className="text-xs text-muted-foreground">
                  {step.detail}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  const base = "mt-0.5 h-4 w-4 shrink-0";

  switch (status) {
    case "complete":
      return <CheckCircle2 className={cn(base, "text-emerald-500")} />;
    case "running":
      return <Loader2 className={cn(base, "animate-spin text-primary")} />;
    case "failed":
      return <XCircle className={cn(base, "text-destructive")} />;
    default:
      return <Circle className={cn(base, "text-muted-foreground/50")} />;
  }
}
