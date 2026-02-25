/**
 * Event Seat Map Manager
 *
 * Orchestrator for the organizer's seating configuration workflow.
 * Shows an elegant empty state when no seat map exists, or a
 * dashboard with stats, preview, and edit controls when configured.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ui/loader';
import {
  Grid3X3,
  Armchair,
  Users,
  DollarSign,
  BarChart3,
  Pencil,
  Trash2,
  Download,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { getSeatMap, deleteSeatMap, type SeatMap, type Seat } from '@/lib/venue-api';
import { useToast } from '@/hooks/useToast';
import { SeatMapBuilder } from './SeatMapBuilder';

interface EventSeatMapManagerProps {
  eventId: string;
}

interface SeatStats {
  total: number;
  available: number;
  reserved: number;
  booked: number;
  blocked: number;
  revenue: number;
  sections: SectionBreakdown[];
}

interface SectionBreakdown {
  id: string;
  name: string;
  rows: number;
  seats: number;
  available: number;
  priceRange: [number, number];
  occupancyPercent: number;
}

export const EventSeatMapManager = ({ eventId }: EventSeatMapManagerProps) => {
  const { toast } = useToast();
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeatMap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSeatMap(eventId);
      setSeatMap(data);
    } catch (err: unknown) {
      // 404 means no seat map configured — that's a valid state
      const axiosErr = err as { response?: { status?: number }; message?: string };
      if (axiosErr?.response?.status === 404 || axiosErr?.message?.includes('not found')) {
        setSeatMap(null);
      } else {
        setError('Failed to load seat map');
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  const stats = useMemo((): SeatStats | null => {
    if (!seatMap?.seats?.length) return null;

    const seats = seatMap.seats;
    const sectionMap = new Map<string, Seat[]>();

    for (const seat of seats) {
      const key = seat.sectionId || 'general';
      if (!sectionMap.has(key)) sectionMap.set(key, []);
      sectionMap.get(key)!.push(seat);
    }

    const sections: SectionBreakdown[] = [];
    for (const [id, sectionSeats] of sectionMap) {
      const prices = sectionSeats
        .map(s => s.price || 0)
        .filter(p => p > 0);
      const available = sectionSeats.filter(s => s.status === 'available').length;
      const uniqueRows = new Set(sectionSeats.map(s => s.rowLabel)).size;

      const sectionName = seatMap.layout?.sections?.find(
        (s: { id: string; name?: string }) => s.id === id
      )?.name || id;

      sections.push({
        id,
        name: sectionName,
        rows: uniqueRows,
        seats: sectionSeats.length,
        available,
        priceRange: prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 0],
        occupancyPercent: sectionSeats.length
          ? Math.round(((sectionSeats.length - available) / sectionSeats.length) * 100)
          : 0,
      });
    }

    const available = seats.filter(s => s.status === 'available').length;
    const reserved = seats.filter(s => s.status === 'reserved').length;
    const booked = seats.filter(s => s.status === 'booked').length;
    const blocked = seats.filter(s => s.status === 'blocked').length;
    const revenue = seats
      .filter(s => s.status === 'booked')
      .reduce((sum, s) => sum + (s.price || 0), 0);

    return { total: seats.length, available, reserved, booked, blocked, revenue, sections };
  }, [seatMap]);

  const handleDelete = async () => {
    if (!confirm('This will permanently remove the seat map and all associated seat data. Continue?')) return;

    try {
      setDeleting(true);
      await deleteSeatMap(eventId);
      setSeatMap(null);
      toast({ title: 'Seat map removed', description: 'All seat data has been deleted.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete seat map', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleBuilderSave = () => {
    setShowBuilder(false);
    loadSeatMap();
  };

  const handleExportCSV = () => {
    if (!seatMap?.seats) return;

    const rows = ['Section,Row,Seat,Type,Status,Price'];
    for (const seat of seatMap.seats) {
      const sectionName = seatMap.layout?.sections?.find(
        (s: { id: string; name?: string }) => s.id === seat.sectionId
      )?.name || seat.sectionId || '';
      rows.push(
        `"${sectionName}","${seat.rowLabel || ''}","${seat.seatLabel || ''}","${seat.seatType}","${seat.status}","${seat.price || 0}"`
      );
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seat-map-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  // --- Builder dialog ---
  if (showBuilder) {
    return (
      <SeatMapBuilder
        eventId={eventId}
        existingSeatMap={seatMap}
        onSave={handleBuilderSave}
        onClose={() => setShowBuilder(false)}
      />
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // --- Empty state ---
  if (!seatMap) {
    return <EmptyState onSetUp={() => setShowBuilder(true)} />;
  }

  // --- Dashboard ---
  return (
    <div className="space-y-6">
      {/* Stats row */}
      {stats && <StatsRow stats={stats} />}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{seatMap.name || 'Seat Map'}</h3>
          <p className="text-sm text-muted-foreground">
            {stats?.total || 0} seats across {stats?.sections.length || 0} section{(stats?.sections.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Removing...' : 'Remove'}
          </Button>
          <Button size="sm" onClick={() => setShowBuilder(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Layout
          </Button>
        </div>
      </div>

      {/* Seat map preview */}
      <SeatMapPreview seatMap={seatMap} />

      {/* Section breakdown */}
      {stats && stats.sections.length > 0 && <SectionBreakdownTable sections={stats.sections} />}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Empty State — A visual invitation to set up seating
// ────────────────────────────────────────────────────────────────

function EmptyState({ onSetUp }: { onSetUp: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Decorative seat grid illustration */}
      <div className="relative mb-8">
        <div className="grid grid-cols-8 gap-1.5 opacity-30">
          {Array.from({ length: 32 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className="w-4 h-4 rounded-sm bg-primary/60"
            />
          ))}
        </div>
        {/* Focal glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>

      <h3 className="text-xl font-semibold mb-2">Bring your venue to life</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-8">
        Define sections, rows, and seat types — then preview the layout instantly. Attendees will choose their perfect spot during registration.
      </p>

      <Button size="lg" onClick={onSetUp} className="gap-2">
        <Plus className="w-5 h-5" />
        Set Up Seating
      </Button>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────
// Stats Row — 4 gradient-icon cards matching the design system
// ────────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: SeatStats }) {
  const cards = [
    {
      title: 'Total Seats',
      value: stats.total,
      icon: Grid3X3,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Available',
      value: stats.available,
      icon: Armchair,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Reserved / Booked',
      value: stats.reserved + stats.booked,
      icon: Users,
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      title: 'Revenue Potential',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
        >
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">{card.title}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Seat Map Preview — read-only visual of the configured layout
// ────────────────────────────────────────────────────────────────

function SeatMapPreview({ seatMap }: { seatMap: SeatMap }) {
  if (!seatMap.seats?.length) return null;

  // Group by section → row
  const sectionMap = new Map<string, Map<string, Seat[]>>();
  for (const seat of seatMap.seats) {
    const secKey = seat.sectionId || 'general';
    if (!sectionMap.has(secKey)) sectionMap.set(secKey, new Map());
    const rowMap = sectionMap.get(secKey)!;
    const rowKey = seat.rowLabel || '?';
    if (!rowMap.has(rowKey)) rowMap.set(rowKey, []);
    rowMap.get(rowKey)!.push(seat);
  }

  const getSeatDotColor = (seat: Seat) => {
    switch (seat.status) {
      case 'available':
        return seat.seatType === 'VIP' ? 'bg-amber-400' : seat.seatType === 'PREMIUM' ? 'bg-purple-400' : 'bg-emerald-400';
      case 'reserved':
        return 'bg-yellow-400';
      case 'booked':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-muted-foreground/30';
      default:
        return 'bg-muted-foreground/20';
    }
  };

  const getSeatIcon = (seat: Seat) => {
    if (seat.seatType === 'WHEELCHAIR') return '♿';
    return null;
  };

  return (
    <Card className="border-border/40 bg-card overflow-hidden">
      <CardContent className="pt-6">
        {/* Stage indicator */}
        <div className="flex justify-center mb-6">
          <div className="px-12 py-2 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border border-primary/20 rounded-full">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">Stage</span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {Array.from(sectionMap.entries()).map(([sectionId, rowMap]) => {
            const sectionName = seatMap.layout?.sections?.find(
              (s: { id: string; name?: string }) => s.id === sectionId
            )?.name || sectionId;

            return (
              <div key={sectionId} className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {sectionName}
                </p>
                {Array.from(rowMap.entries()).map(([rowLabel, seats]) => (
                  <div key={rowLabel} className="flex items-center gap-2">
                    <span className="w-6 text-[10px] font-mono text-muted-foreground text-right shrink-0">
                      {rowLabel}
                    </span>
                    <div className="flex gap-[3px] justify-center flex-1">
                      {seats.map(seat => {
                        const icon = getSeatIcon(seat);
                        return (
                          <div
                            key={seat.id}
                            className={`w-3.5 h-3.5 rounded-[3px] ${getSeatDotColor(seat)} transition-transform hover:scale-150 cursor-default`}
                            title={`${seat.rowLabel}${seat.seatLabel} — ${seat.seatType} — $${seat.price || 0}`}
                          >
                            {icon && <span className="text-[6px] flex items-center justify-center h-full">{icon}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <span className="w-6 text-[10px] font-mono text-muted-foreground shrink-0">
                      {rowLabel}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border/40 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> VIP</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-400" /> Premium</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" /> Reserved</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" /> Blocked</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────
// Section Breakdown Table
// ────────────────────────────────────────────────────────────────

function SectionBreakdownTable({ sections }: { sections: SectionBreakdown[] }) {
  return (
    <Card className="border-border/40 bg-card">
      <CardContent className="pt-6">
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          Section Breakdown
        </h4>
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{section.name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span>{section.rows} row{section.rows !== 1 ? 's' : ''}</span>
                    <span>{section.seats} seat{section.seats !== 1 ? 's' : ''}</span>
                    {section.priceRange[1] > 0 && (
                      <span>
                        ${section.priceRange[0]} – ${section.priceRange[1]}
                      </span>
                    )}
                  </div>
                </div>
                {/* Occupancy bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${section.occupancyPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      section.occupancyPercent >= 90
                        ? 'bg-destructive'
                        : section.occupancyPercent >= 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {section.occupancyPercent}% filled
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
