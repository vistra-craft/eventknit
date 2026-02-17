import { useState, useEffect, useMemo } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  /** Total milliseconds remaining */
  totalMs: number;
}

/**
 * Live countdown hook. Ticks every second until the target date.
 * Returns { days, hours, minutes, seconds, isExpired }.
 */
export function useCountdown(targetDate: string | Date | null | undefined): CountdownResult {
  const target = useMemo(() => {
    if (!targetDate) return null;
    const d = new Date(targetDate);
    return isNaN(d.getTime()) ? null : d;
  }, [targetDate]);

  const calcRemaining = () => {
    if (!target) return 0;
    return Math.max(0, target.getTime() - Date.now());
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (!target) return;
    setRemaining(calcRemaining());
    const id = setInterval(() => {
      const ms = calcRemaining();
      setRemaining(ms);
      if (ms <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return { days, hours, minutes, seconds, isExpired: remaining <= 0, totalMs: remaining };
}
