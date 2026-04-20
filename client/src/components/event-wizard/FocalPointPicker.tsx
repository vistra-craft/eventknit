import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Move, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocalPointPickerProps {
  imageUrl: string;
  focalX: number;
  focalY: number;
  onFocalPointChange: (x: number, y: number) => void;
  onReplace?: () => void;
  onRemove?: () => void;
  className?: string;
}

/**
 * Unified image preview + focal point picker.
 *
 * The uploaded image itself is interactive — click or drag anywhere to
 * reposition the focal point. Two live crop previews (banner & card)
 * update in real-time so the user can see exactly how the image will
 * appear in different contexts.
 */
export function FocalPointPicker({
  imageUrl,
  focalX,
  focalY,
  onFocalPointChange,
  onReplace,
  onRemove,
  className,
}: FocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      // Don't hijack clicks on action buttons
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setIsDragging(true);
      calculatePosition(e.clientX, e.clientY);
    },
    [calculatePosition]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setIsDragging(true);
      const touch = e.touches[0];
      calculatePosition(touch.clientX, touch.clientY);
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
    <div className={cn('space-y-3', className)}>
      {/* ── Main image: serves as both preview and focal-point picker ── */}
      <div
        ref={containerRef}
        className={cn(
          'group relative overflow-hidden rounded-xl border border-border/40 cursor-crosshair select-none',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img
          src={imageUrl}
          alt="Event cover"
          className="w-full h-72 object-cover"
          draggable={false}
        />

        {/* Action buttons — glass overlay, visible on hover / always on mobile */}
        <div className="absolute top-3 right-3 flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          {onReplace && (
            <Button
              type="button"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onReplace(); }}
              className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border-0 h-8 gap-1.5 text-xs shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </Button>
          )}
          {onRemove && (
            <Button
              type="button"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="bg-black/50 backdrop-blur-sm hover:bg-red-600/90 text-white border-0 h-8 w-8 p-0 shadow-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Focal point marker */}
        <div
          className={cn(
            'absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none',
            isDragging ? 'scale-110' : 'transition-all duration-200'
          )}
          style={{
            left: `${focalX}%`,
            top: `${focalY}%`,
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-white shadow-lg" />
          <div className="absolute inset-2 rounded-full bg-primary border-2 border-white shadow-md" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50 -translate-y-1/2" />
        </div>

        {/* Hint — visible on hover, hidden while dragging */}
        <div
          className={cn(
            'absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white/90 pointer-events-none transition-opacity duration-200',
            isDragging ? 'opacity-0' : 'opacity-0 sm:group-hover:opacity-100'
          )}
        >
          <Move className="w-3 h-3" />
          <span>Click or drag to set focus point</span>
        </div>
      </div>

      {/* ── Live crop previews ── */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Drag the focus point to control how your image appears when cropped.
        </p>
        <div className="flex gap-3">
          {/* Banner preview — wide crop like event page headers */}
          <div className="flex-1 space-y-1">
            <div
              className="overflow-hidden rounded-lg border border-border/40"
              style={{ aspectRatio: '16 / 6' }}
            >
              <img
                src={imageUrl}
                alt="Banner crop preview"
                className="w-full h-full object-cover"
                style={{ objectPosition: `${focalX}% ${focalY}%` }}
                draggable={false}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
              Event page banner
            </span>
          </div>

          {/* Card preview — taller crop like listing cards */}
          <div className="w-24 sm:w-28 space-y-1">
            <div
              className="overflow-hidden rounded-lg border border-border/40"
              style={{ aspectRatio: '3 / 4' }}
            >
              <img
                src={imageUrl}
                alt="Card crop preview"
                className="w-full h-full object-cover"
                style={{ objectPosition: `${focalX}% ${focalY}%` }}
                draggable={false}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
              Listing card
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
