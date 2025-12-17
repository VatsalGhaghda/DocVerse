import { Button } from "@/components/ui/button";
import { LucideIcon, Download } from "lucide-react";

export function ToolSuccessState(props: {
  icon: LucideIcon;
  iconColor: "primary" | "secondary" | "accent";
  title: string;
  description: string;
  downloadLabel: string;
  onDownload: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  disabledDownload?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const iconBg = {
    primary: "bg-primary/10",
    secondary: "bg-secondary/10",
    accent: "bg-accent/10",
  };

  const iconFg = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  const Icon = props.icon;

  const primaryButtonClass = {
    primary: "btn-hero gradient-primary shadow-primary",
    secondary: "btn-hero gradient-secondary",
    accent: "btn-hero bg-accent text-accent-foreground hover:bg-accent/90",
  };

  return (
    <div ref={props.containerRef} className="text-center py-12">
      <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${iconBg[props.iconColor]}`}>
        <Icon className={`h-10 w-10 ${iconFg[props.iconColor]}`} />
      </div>
      <h2 className="text-2xl font-bold mb-2">{props.title}</h2>
      <p className="text-muted-foreground mb-8">{props.description}</p>
      <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-2">
        <Button
          size="lg"
          className={primaryButtonClass[props.iconColor]}
          onClick={props.onDownload}
          disabled={props.disabledDownload}
          style={{ width: "100%" }}
        >
          <Download className="h-5 w-5 mr-2" />
          {props.downloadLabel}
        </Button>
        <Button variant="outline" onClick={props.onSecondary} className="w-full">
          {props.secondaryLabel}
        </Button>
      </div>
    </div>
  );
}
