import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Move, Target } from 'lucide-react';

interface FocalPointPickerProps {
  imageUrl: string;
  focalX: number;
  focalY: number;
  onFocalPointChange: (x: number, y: number) => void;
  className?: string;
}

/**
 * FocalPointPicker allows users to select the focal point of an image.
 * The focal point determines which part of the image remains visible
 * when the image is cropped for different aspect ratios.
 */
export function FocalPointPicker({
  imageUrl,
  focalX,
  focalY,
  onFocalPointChange,
  className,
}: FocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

  const calculatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

      onFocalPointChange(Math.round(x), Math.round(y));
    },
    [onFocalPointChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      calculatePosition(e.clientX, e.clientY);
    },
    [calculatePosition]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      calculatePosition(e.clientX, e.clientY);
    },
    [isDragging, calculatePosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const touch = e.touches[0];
      calculatePosition(touch.clientX, touch.clientY);
    },
    [calculatePosition]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      calculatePosition(touch.clientX, touch.clientY);
    },
    [isDragging, calculatePosition]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4" />
          <span>Set focus point</span>
        </div>
        <button
          type="button"
          onClick={() => setShowGuides(!showGuides)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showGuides ? 'Hide guides' : 'Show guides'}
        </button>
      </div>

      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden rounded-lg border cursor-crosshair select-none',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => setShowGuides(true)}
        onMouseLeave={() => !isDragging && setShowGuides(false)}
      >
        <img
          src={imageUrl}
          alt="Focal point picker"
          className="w-full h-64 object-contain bg-muted/30"
          draggable={false}
        />

        {/* Crop preview overlays showing different aspect ratios */}
        {showGuides && (
          <>
            {/* Horizontal crop guide (banner ratio ~3:1) */}
            <div
              className="absolute inset-x-0 bg-black/40 pointer-events-none transition-opacity"
              style={{
                top: 0,
                height: `${Math.max(0, focalY - 15)}%`,
              }}
            />
            <div
              className="absolute inset-x-0 bg-black/40 pointer-events-none transition-opacity"
              style={{
                bottom: 0,
                height: `${Math.max(0, 100 - focalY - 15)}%`,
              }}
            />
          </>
        )}

        {/* Focal point marker */}
        <div
          className={cn(
            'absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform',
            isDragging && 'scale-110'
          )}
          style={{
            left: `${focalX}%`,
            top: `${focalY}%`,
          }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white shadow-lg" />
          {/* Inner dot */}
          <div className="absolute inset-2 rounded-full bg-primary border-2 border-white shadow-md" />
          {/* Crosshair lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60 -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/60 -translate-y-1/2" />
        </div>

        {/* Drag instruction overlay */}
        {!isDragging && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
            <Move className="w-3 h-3" />
            <span>Click or drag to set focus</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        The focus point determines which part of your image stays visible when cropped for cards and banners.
      </p>
    </div>
  );
}
