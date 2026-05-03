import { HardDrive } from "lucide-react";

interface StorageIndicatorProps {
  usedMB: number;
  limitMB: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StorageIndicator({
  usedMB,
  limitMB,
  showLabel = true,
  size = "md",
}: StorageIndicatorProps) {
  const percent = Math.min((usedMB / limitMB) * 100, 100);
  const remaining = Math.max(limitMB - usedMB, 0);

  const barHeight = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];

  const textColor = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const barColor =
    percent > 90
      ? "bg-destructive"
      : percent > 70
        ? "bg-yellow-500"
        : "bg-primary";

  return (
    <div className="w-full space-y-1" role="group" aria-label="Storage usage">
      {showLabel && (
        <div className={`flex items-center justify-between ${textColor}`}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            <span>
              {usedMB.toFixed(1)} MB / {limitMB} MB
            </span>
          </div>
          <span className="text-muted-foreground">{remaining.toFixed(1)} MB left</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-muted ${barHeight}`}>
        <div
          className={`${barHeight} rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={usedMB}
          aria-valuemin={0}
          aria-valuemax={limitMB}
          aria-label={`${percent.toFixed(0)}% of ${limitMB} MB used`}
        />
      </div>
    </div>
  );
}
