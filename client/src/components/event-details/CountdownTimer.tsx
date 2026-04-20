import { useCountdown } from "@/hooks/useCountdown";

interface CountdownTimerProps {
  targetDate: string | Date | null | undefined;
  label?: string;
}

export function CountdownTimer({ targetDate, label = "Registration closes in" }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired, totalMs } = useCountdown(targetDate);

  if (!targetDate || isExpired) return null;

  // If more than 30 days, show simplified view
  if (days > 30) {
    return (
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-semibold text-foreground">{days} days left</p>
      </div>
    );
  }

  // Urgency coloring
  const isUrgent = totalMs < 24 * 60 * 60 * 1000; // < 1 day
  const digitClass = isUrgent
    ? "text-red-600 dark:text-red-400"
    : "text-foreground";

  return (
    <div>
      <p className="text-xs text-muted-foreground text-center mb-2">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        <DigitBox value={days} unit="Days" className={digitClass} />
        <DigitBox value={hours} unit="Hrs" className={digitClass} />
        <DigitBox value={minutes} unit="Min" className={digitClass} />
        <DigitBox value={seconds} unit="Sec" className={digitClass} />
      </div>
    </div>
  );
}

function DigitBox({ value, unit, className }: { value: number; unit: string; className?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-muted/60 py-2.5">
      <span className={`text-xl font-bold tabular-nums leading-none ${className ?? ""}`}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{unit}</span>
    </div>
  );
}
