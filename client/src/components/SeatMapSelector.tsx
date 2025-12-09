/**
 * Interactive Seat Map Selector Component
 * 
 * Allows users to select seats from an interactive venue map
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSeatMapAvailability, reserveSeats, type Seat, type SeatMap } from '@/lib/venue-api';
import { Loader2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SeatMapSelectorProps {
  eventId: string;
  registrationId: string;
  onSeatsSelected?: (seatIds: string[], totalPrice: number) => void;
  maxSeats?: number;
  requiredSeats?: number;
}

const SeatMapSelector = ({
  eventId,
  registrationId,
  onSeatsSelected,
  maxSeats,
  requiredSeats = 1,
}: SeatMapSelectorProps) => {
  const { toast } = useToast();
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeatMap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSeatMapAvailability(eventId);
      setSeatMap(data);
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(message || "Failed to load seat map");
      toast({
        title: 'Error',
        description: 'Failed to load seat map',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  const handleSeatClick = useCallback((seat: Seat) => {
    if (seat.status !== 'available') {
      return; // Can't select unavailable seats
    }

    setSelectedSeats((prev) => {
      const newSet = new Set(prev);
      
      if (newSet.has(seat.id)) {
        // Deselect
        newSet.delete(seat.id);
      } else {
        // Check max seats limit
        if (maxSeats && newSet.size >= maxSeats) {
          toast({
            title: 'Maximum seats reached',
            description: `You can only select up to ${maxSeats} seats`,
            variant: 'destructive',
          });
          return prev;
        }
        newSet.add(seat.id);
      }
      
      return newSet;
    });
  }, [maxSeats, toast]);

  const handleReserveSeats = async () => {
    if (selectedSeats.size < requiredSeats) {
      toast({
        title: 'Selection required',
        description: `Please select at least ${requiredSeats} seat(s)`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setReserving(true);
      setError(null);

      const seatIds = Array.from(selectedSeats);
      await reserveSeats(eventId, {
        seatIds,
        registrationId,
        reservationTimeoutMinutes: 15,
      });

      // Calculate total price
      const totalPrice = seatIds.reduce((sum, seatId) => {
        const seat = seatMap?.seats?.find(s => s.id === seatId);
        return sum + (seat?.price || 0);
      }, 0);

      toast({
        title: 'Success',
        description: `Reserved ${seatIds.length} seat(s)`,
      });

      if (onSeatsSelected) {
        onSeatsSelected(seatIds, totalPrice);
      }
    } catch (err: unknown) {
      const errorMsg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg || 'Failed to reserve seats',
        variant: 'destructive',
      });
    } finally {
      setReserving(false);
    }
  };

  const getSeatStatusColor = (seat: Seat, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    }

    switch (seat.status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 border-green-300';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 cursor-not-allowed opacity-60';
      case 'booked':
        return 'bg-red-100 border-red-300 cursor-not-allowed opacity-60';
      case 'blocked':
        return 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-40';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getSeatTypeLabel = (seatType: Seat['seatType']) => {
    const labels: Record<string, string> = {
      STANDARD: 'Standard',
      VIP: 'VIP',
      PREMIUM: 'Premium',
      WHEELCHAIR: 'Wheelchair',
      COMPANION: 'Companion',
      STANDING: 'Standing',
    };
    return labels[seatType] || seatType;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !seatMap) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!seatMap || !seatMap.seats || seatMap.seats.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>No seat map available for this event</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Group seats by section
  const seatsBySection = seatMap.seats.reduce((acc, seat) => {
    const sectionId = seat.sectionId || 'general';
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Calculate total price
  const totalPrice = Array.from(selectedSeats).reduce((sum, seatId) => {
    const seat = seatMap.seats?.find(s => s.id === seatId);
    return sum + (seat?.price || 0);
  }, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Your Seats</CardTitle>
          <CardDescription>
            Click on available seats to select them. Selected seats will be reserved for 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border border-green-300 rounded" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded opacity-60" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border border-red-300 rounded opacity-60" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded opacity-40" />
              <span>Blocked</span>
            </div>
          </div>

          {/* Seat Map */}
          {seatMap.imageUrl ? (
            <div className="relative border rounded-lg overflow-hidden">
              <img
                src={seatMap.imageUrl}
                alt="Venue map"
                className="w-full h-auto"
                style={{
                  maxHeight: seatMap.height ? `${seatMap.height}px` : '600px',
                  objectFit: 'contain',
                }}
              />
              {/* Overlay seats on image */}
              <div className="absolute inset-0">
                {seatMap.seats?.map((seat) => {
                  if (!seat.x || !seat.y) return null;
                  const isSelected = selectedSeats.has(seat.id);
                  
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status !== 'available'}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded border-2 text-xs font-medium transition-colors ${getSeatStatusColor(seat, isSelected)}`}
                      style={{
                        left: `${seat.x}%`,
                        top: `${seat.y}%`,
                        transform: seat.angle
                          ? `translate(-50%, -50%) rotate(${seat.angle}deg)`
                          : 'translate(-50%, -50%)',
                      }}
                      title={`${seat.rowLabel}${seat.seatLabel} - ${seat.price ? `$${seat.price.toFixed(2)}` : 'Free'}`}
                    >
                      {seat.seatLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Text-based seat map */
            <div className="space-y-6">
              {Object.entries(seatsBySection).map(([sectionId, seats]) => {
                // Group by row
                const seatsByRow = seats.reduce((acc, seat) => {
                  const rowLabel = seat.rowLabel || 'General';
                  if (!acc[rowLabel]) {
                    acc[rowLabel] = [];
                  }
                  acc[rowLabel].push(seat);
                  return acc;
                }, {} as Record<string, Seat[]>);

                return (
                  <div key={sectionId} className="space-y-3">
                    <h3 className="font-semibold text-lg">
                      {seatMap.layout?.sections?.find((s) => s.id === sectionId)?.name || sectionId}
                    </h3>
                    {Object.entries(seatsByRow).map(([rowLabel, rowSeats]) => (
                      <div key={rowLabel} className="flex items-center gap-2">
                        <span className="font-medium w-8 text-sm">{rowLabel}</span>
                        <div className="flex gap-1 flex-wrap">
                          {rowSeats.map((seat) => {
                            const isSelected = selectedSeats.has(seat.id);
                            return (
                              <button
                                key={seat.id}
                                type="button"
                                onClick={() => handleSeatClick(seat)}
                                disabled={seat.status !== 'available'}
                                className={`w-10 h-10 rounded border-2 text-xs font-medium transition-colors ${getSeatStatusColor(seat, isSelected)}`}
                                title={`${seat.seatLabel} - ${seat.price ? `$${seat.price.toFixed(2)}` : 'Free'} - ${getSeatTypeLabel(seat.seatType)}`}
                              >
                                {seat.seatLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selection Summary */}
          {selectedSeats.size > 0 && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Selected Seats:</span>
                <span className="text-sm text-muted-foreground">
                  {selectedSeats.size} seat{selectedSeats.size !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedSeats).map((seatId) => {
                  const seat = seatMap.seats?.find(s => s.id === seatId);
                  if (!seat) return null;
                  return (
                    <Badge key={seatId} variant="secondary" className="flex items-center gap-1">
                      {seat.rowLabel}
                      {seat.seatLabel}
                      {seat.price && ` - $${seat.price.toFixed(2)}`}
                      <button
                        type="button"
                        onClick={() => handleSeatClick(seat)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <div className="flex items-center justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleReserveSeats}
              disabled={selectedSeats.size < requiredSeats || reserving}
              className="flex-1"
            >
              {reserving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reserving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reserve Seats
                </>
              )}
            </Button>
            {selectedSeats.size > 0 && (
              <Button
                variant="outline"
                onClick={() => setSelectedSeats(new Set())}
                disabled={reserving}
              >
                Clear Selection
              </Button>
            )}
          </div>

          {selectedSeats.size < requiredSeats && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please select at least {requiredSeats} seat{requiredSeats !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatMapSelector;

