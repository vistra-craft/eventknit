import { motion } from "framer-motion";

interface AmbientGlowProps {
  className: string;
  duration?: number;
  delay?: number;
}

export function AmbientGlow({ className, duration = 30, delay = 0 }: AmbientGlowProps) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}
