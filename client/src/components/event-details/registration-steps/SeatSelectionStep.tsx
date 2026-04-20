/**
 * Seat Selection Step
 *
 * Allows attendees to browse and select seats from the venue's
 * seat map during the registration flow. Selected seat IDs are
 * passed upstream — actual reservation happens atomically when
 * the registration is created.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ui/loader';
import { getSeatMapAvailability, type Seat, type SeatMap } from '@/lib/venue-api';
import { Armchair, XCircle, Info, ArrowRight } from 'lucide-react';
import type { EventData } from '@/types/event';

interface SeatSelectionStepProps {
  event: EventData;
  totalTickets: number;
  onContinue: (seatIds: string[], seatTotalPrice: number) => void;
  onSkip: () => void;
}

export const SeatSelectionStep = ({
  event,
  totalTickets,
  onContinue,
  onSkip,
}: SeatSelectionStepProps) => {
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  const maxSeats = totalTickets;

  // Load seat map
  const loadSeatMap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSeatMapAvailability(event.id);
      setSeatMap(data);
    } catch {
      setError('Unable to load seat map');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  // Seat click handler
  const handleSeatClick = useCallback((seat: Seat) => {
    if (seat.status !== 'available') return;

    setSelectedSeats(prev => {
      const next = new Set(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
      } else if (next.size < maxSeats) {
        next.add(seat.id);
      }
      return next;
    });
  }, [maxSeats]);

  // Calculate total seat price
  const seatTotal = useMemo(() => {
    if (!seatMap?.seats) return 0;
    return Array.from(selectedSeats).reduce((sum, id) => {
      const seat = seatMap.seats?.find(s => s.id === id);
      return sum + (seat?.price || 0);
    }, 0);
  }, [selectedSeats, seatMap]);

  // Group seats by section → row
  const sectionMap = useMemo(() => {
    if (!seatMap?.seats) return new Map<string, Map<string, Seat[]>>();

    const map = new Map<string, Map<string, Seat[]>>();
    for (const seat of seatMap.seats) {
      const secKey = seat.sectionId || 'general';
      if (!map.has(secKey)) map.set(secKey, new Map());
      const rowMap = map.get(secKey)!;
      const rowKey = seat.rowLabel || '?';
      if (!rowMap.has(rowKey)) rowMap.set(rowKey, []);
      rowMap.get(rowKey)!.push(seat);
    }
    return map;
  }, [seatMap]);

  const getSeatColor = (seat: Seat, isSelected: boolean) => {
    if (isSelected) return 'bg-primary ring-2 ring-primary/30';
    switch (seat.status) {
      case 'available':
        return seat.seatType === 'VIP'
          ? 'bg-amber-400/80 hover:bg-amber-400 cursor-pointer'
          : seat.seatType === 'PREMIUM'
          ? 'bg-purple-400/80 hover:bg-purple-400 cursor-pointer'
          : 'bg-emerald-400/70 hover:bg-emerald-400 cursor-pointer';
      case 'reserved':
        return 'bg-yellow-400/40 cursor-not-allowed';
      case 'booked':
        return 'bg-muted-foreground/20 cursor-not-allowed';
      case 'blocked':
        return 'bg-muted-foreground/10 cursor-not-allowed';
      default:
        return 'bg-muted cursor-not-allowed';
    }
  };

  const handleContinue = () => {
    onContinue(Array.from(selectedSeats), seatTotal);
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader size="lg" />
        <p className="text-sm text-muted-foreground mt-4">Loading venue map...</p>
      </div>
    );
  }

  // --- Error / no map ---
  if (error || !seatMap?.seats?.length) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {error || 'No seat map is available. You can proceed without selecting seats.'}
          </AlertDescription>
        </Alert>
        <Button onClick={onSkip} className="w-full">
          Continue without seat selection
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  const availableCount = seatMap.seats.filter(s => s.status === 'available').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-section-header mb-1">Choose your seats</h3>
        <p className="text-card-description">
          {availableCount} seat{availableCount !== 1 ? 's' : ''} available &middot; select up to {maxSeats}
        </p>
      </div>

      {/* Seat Map */}
      <Card className="p-4 overflow-x-auto">
        {/* Stage */}
        <div className="flex justify-center mb-5">
          <div className="px-10 py-1.5 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border border-primary/20 rounded-full">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-primary">Stage</span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {Array.from(sectionMap.entries()).map(([sectionId, rowMap]) => {
            const sectionName = seatMap.layout?.sections?.find(
              (s: { id: string; name?: string }) => s.id === sectionId
            )?.name || sectionId;

            return (
              <div key={sectionId} className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {sectionName}
                </p>
                {Array.from(rowMap.entries()).map(([rowLabel, seats]) => (
                  <div key={rowLabel} className="flex items-center gap-1.5">
                    <span className="w-5 text-[9px] font-mono text-muted-foreground text-right shrink-0">
                      {rowLabel}
                    </span>
                    <div className="flex gap-[3px] justify-center flex-1">
                      {seats.map(seat => {
                        const isSelected = selectedSeats.has(seat.id);
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status !== 'available'}
                            className={`w-7 h-7 rounded text-[8px] font-medium transition-all ${getSeatColor(seat, isSelected)}`}
                            title={`${seat.rowLabel}${seat.seatLabel} — ${seat.seatType} — $${seat.price || 0}`}
                          >
                            {seat.seatLabel}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-5 text-[9px] font-mono text-muted-foreground shrink-0">
                      {rowLabel}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t flex flex-wrap gap-3 justify-center text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> Selected</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" /> VIP</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-400" /> Premium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/20" /> Unavailable</span>
        </div>
      </Card>

      {/* Selection summary */}
      {selectedSeats.size > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Armchair className="w-4 h-4" />
              {selectedSeats.size} seat{selectedSeats.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedSeats(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selectedSeats).map(id => {
              const seat = seatMap.seats?.find(s => s.id === id);
              if (!seat) return null;
              return (
                <Badge key={id} variant="secondary" className="gap-1 text-xs">
                  {seat.rowLabel}{seat.seatLabel}
                  {seat.price ? ` · $${seat.price}` : ''}
                  <button
                    type="button"
                    onClick={() => handleSeatClick(seat)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
          {seatTotal > 0 && (
            <div className="mt-2 pt-2 border-t border-primary/10 flex justify-between text-sm font-semibold">
              <span>Seat total</span>
              <span>${seatTotal.toFixed(2)}</span>
            </div>
          )}
        </Card>
      )}

      {selectedSeats.size < maxSeats && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Select {maxSeats - selectedSeats.size} more seat{maxSeats - selectedSeats.size !== 1 ? 's' : ''} to continue, or skip seat selection.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedSeats.size === 0}
          className="flex-1"
        >
          Continue with {selectedSeats.size} seat{selectedSeats.size !== 1 ? 's' : ''}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
