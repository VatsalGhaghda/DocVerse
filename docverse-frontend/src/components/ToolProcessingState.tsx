import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ToolProcessingState(props: {
  title: string;
  progress: number;
  error?: string | null;
  color: "primary" | "secondary" | "accent";
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    setShowSlowHint(false);
    const t = window.setTimeout(() => setShowSlowHint(true), 30_000);
    return () => window.clearTimeout(t);
  }, [props.title]);

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  const baseRing = {
    primary: "border-primary-foreground/10",
    secondary: "border-secondary-foreground/10",
    accent: "border-accent-foreground/10",
  };

  return (
    <div ref={props.containerRef} className="py-10 sm:py-16 flex flex-col items-center gap-6">
      <h2 className="text-2xl font-semibold">{props.title}</h2>
      <div className="relative h-24 w-24">
        <div className={cn("h-24 w-24 rounded-full border-[6px]", baseRing[props.color])} />
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[6px] border-current animate-spin border-t-transparent",
            colorClasses[props.color]
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          {props.progress}%
        </div>
      </div>
      {showSlowHint && !props.error ? (
        <p className="text-sm text-muted-foreground text-center max-w-md px-2">
          This may take a while for larger files. Please keep this tab open.
        </p>
      ) : null}
      {props.error ? (
        <p className="mt-2 text-sm text-destructive text-center max-w-md px-2">{props.error}</p>
      ) : null}
    </div>
  );
}
