import { useRef, useState, useCallback, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { motion } from "framer-motion";

/** Returns mouse position relative to element center for 3D tilt effect */
function useMouseTilt() {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: ReactMouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rotateX: -y * 12, rotateY: x * 12 });
  }, []);

  const handleLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return { ref, tilt, handleMove, handleLeave };
}

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

/** Card with 3D perspective tilt on hover + cursor spotlight */
export function TiltCard({ children, className }: TiltCardProps) {
  const { ref, tilt, handleMove, handleLeave } = useMouseTilt();
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  const onMove = useCallback((e: ReactMouseEvent) => {
    handleMove(e);
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSpotlight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [handleMove, ref]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={handleLeave}
      animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 180px at ${spotlight.x}% ${spotlight.y}%, hsl(var(--primary) / 0.08), transparent)`,
        }}
      />
      {children}
    </motion.div>
  );
}
