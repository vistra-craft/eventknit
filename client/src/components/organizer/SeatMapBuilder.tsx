/**
 * Seat Map Builder
 *
 * A structured visual builder where organizers define sections and rows.
 * The system generates the seat layout in real time and a live preview
 * shows the result as a grid of color-coded dots.
 *
 * Two-panel layout: left = configuration cards, right = live preview.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  Armchair,
  Crown,
  Star,
  Accessibility,
  Users,
  Sparkles,
  Grid3X3,
} from 'lucide-react';
import { upsertSeatMap, type SeatMap } from '@/lib/venue-api';
import { useToast } from '@/hooks/useToast';
import { Loader } from '@/components/ui/loader';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

type SeatType = 'STANDARD' | 'VIP' | 'PREMIUM' | 'WHEELCHAIR' | 'COMPANION' | 'STANDING';

interface SectionConfig {
  id: string;
  name: string;
  type: 'seated' | 'standing';
  rows: number;
  seatsPerRow: number;
  seatType: SeatType;
  price: number;
  color: string;
  collapsed: boolean;
  /** Per-row overrides: { rowIndex: { seatType, price } } */
  rowOverrides: Record<number, { seatType?: SeatType; price?: number }>;
}

interface SeatMapBuilderProps {
  eventId: string;
  existingSeatMap: SeatMap | null;
  onSave: () => void;
  onClose: () => void;
}

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const SECTION_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

const SEAT_TYPE_META: Record<SeatType, { label: string; icon: typeof Armchair }> = {
  STANDARD: { label: 'Standard', icon: Armchair },
  VIP: { label: 'VIP', icon: Crown },
  PREMIUM: { label: 'Premium', icon: Star },
  WHEELCHAIR: { label: 'Wheelchair', icon: Accessibility },
  COMPANION: { label: 'Companion', icon: Users },
  STANDING: { label: 'Standing', icon: Users },
};

const SECTION_TEMPLATES: { name: string; rows: number; seatsPerRow: number; seatType: SeatType; price: number }[] = [
  { name: 'Orchestra', rows: 10, seatsPerRow: 20, seatType: 'STANDARD', price: 75 },
  { name: 'Balcony', rows: 5, seatsPerRow: 15, seatType: 'STANDARD', price: 50 },
  { name: 'VIP Box', rows: 3, seatsPerRow: 8, seatType: 'VIP', price: 150 },
  { name: 'Standing Area', rows: 1, seatsPerRow: 50, seatType: 'STANDING', price: 30 },
  { name: 'Accessible', rows: 2, seatsPerRow: 6, seatType: 'WHEELCHAIR', price: 75 },
];

/** Shape of a section in the persisted layout JSON */
interface LayoutSection {
  id?: string;
  name?: string;
  rows?: Array<{
    id?: string;
    label?: string;
    seats?: Array<{
      label?: string;
      type?: SeatType;
      price?: string;
    }>;
  }>;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function rowLetter(index: number): string {
  // A, B, C, ... Z, AA, AB, ...
  let label = '';
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

// ────────────────────────────────────────────────────────────────
// Parse existing seat map into section configs (for edit mode)
// ────────────────────────────────────────────────────────────────

function parseSeatMapToSections(seatMap: SeatMap): SectionConfig[] {
  if (!seatMap.layout?.sections?.length) return [];

  return seatMap.layout.sections.map((section: LayoutSection, i: number) => {
    const rows = section.rows || [];
    const seatsPerRow = rows.length > 0 ? rows[0].seats?.length || 0 : 0;

    // Detect seat type from first seat in first row
    const firstSeat = rows[0]?.seats?.[0];
    const seatType: SeatType = (firstSeat?.type as SeatType) || 'STANDARD';

    // Detect price from first seat
    const price = firstSeat?.price ? parseFloat(firstSeat.price) : 0;

    return {
      id: section.id || generateId(),
      name: section.name || `Section ${i + 1}`,
      type: (seatType === 'STANDING' ? 'standing' : 'seated') as 'seated' | 'standing',
      rows: rows.length,
      seatsPerRow,
      seatType,
      price,
      color: SECTION_COLORS[i % SECTION_COLORS.length],
      collapsed: true,
      rowOverrides: {} as Record<number, { seatType?: SeatType; price?: number }>,
    };
  });
}

// ────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────

export const SeatMapBuilder = ({ eventId, existingSeatMap, onSave, onClose }: SeatMapBuilderProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [mapName, setMapName] = useState(existingSeatMap?.name || 'Main Venue');
  const [sections, setSections] = useState<SectionConfig[]>(
    existingSeatMap ? parseSeatMapToSections(existingSeatMap) : []
  );

  // ─── Section CRUD ──────────────────────────────────────────

  const addSection = useCallback((template?: typeof SECTION_TEMPLATES[0]) => {
    const idx = sections.length;
    setSections(prev => [
      ...prev,
      {
        id: generateId(),
        name: template?.name || `Section ${idx + 1}`,
        type: (template?.seatType === 'STANDING' ? 'standing' : 'seated') as 'seated' | 'standing',
        rows: template?.rows || 5,
        seatsPerRow: template?.seatsPerRow || 10,
        seatType: template?.seatType || 'STANDARD',
        price: template?.price || 50,
        color: SECTION_COLORS[idx % SECTION_COLORS.length],
        collapsed: false,
        rowOverrides: {},
      },
    ]);
  }, [sections.length]);

  const updateSection = useCallback((id: string, patch: Partial<SectionConfig>) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  }, []);

  const moveSection = useCallback((index: number, direction: -1 | 1) => {
    setSections(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }, []);

  // ─── Build layout JSON from section configs ────────────────

  const layout = useMemo(() => {
    const layoutSections = sections.map(section => {
      const rows = Array.from({ length: section.rows }, (_, ri) => {
        const override = section.rowOverrides[ri];
        const seats = Array.from({ length: section.seatsPerRow }, (_, si) => ({
          label: String(si + 1),
          type: override?.seatType || section.seatType,
          price: String(override?.price ?? section.price),
        }));

        return {
          id: `${section.id}-row-${ri}`,
          label: rowLetter(ri),
          seats,
        };
      });

      return {
        id: section.id,
        name: section.name,
        rows,
      };
    });

    return { sections: layoutSections };
  }, [sections]);

  // ─── Derived totals ────────────────────────────────────────

  const totals = useMemo(() => {
    let seats = 0;
    let revenue = 0;

    for (const section of sections) {
      for (let ri = 0; ri < section.rows; ri++) {
        const override = section.rowOverrides[ri];
        const price = override?.price ?? section.price;
        seats += section.seatsPerRow;
        revenue += section.seatsPerRow * price;
      }
    }

    return { seats, revenue, sections: sections.length };
  }, [sections]);

  // ─── Save ──────────────────────────────────────────────────

  const handleSave = async () => {
    if (sections.length === 0) {
      toast({ title: 'No sections', description: 'Add at least one section before saving.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      await upsertSeatMap(eventId, { name: mapName, layout });
      toast({ title: 'Seat map saved', description: `${totals.seats} seats across ${totals.sections} sections.` });
      onSave();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Failed to save',
        description: axiosErr?.response?.data?.error || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <Input
              value={mapName}
              onChange={e => setMapName(e.target.value)}
              className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
              placeholder="Seat map name"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || sections.length === 0}>
          {saving ? (
            <>
              <Loader size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Layout
            </>
          )}
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel — Configuration */}
        <div className="space-y-4 order-2 lg:order-1">
          <AnimatePresence mode="popLayout">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SectionCard
                  section={section}
                  index={index}
                  total={sections.length}
                  onUpdate={patch => updateSection(section.id, patch)}
                  onRemove={() => removeSection(section.id)}
                  onMove={dir => moveSection(index, dir)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add section */}
          <Card className="border-dashed border-2 border-border/60 bg-transparent hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 pb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Add a section</p>
              <div className="flex flex-wrap gap-2">
                {SECTION_TEMPLATES.map(tmpl => (
                  <Button
                    key={tmpl.name}
                    size="sm"
                    variant="outline"
                    onClick={() => addSection(tmpl)}
                    className="gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    {tmpl.name}
                  </Button>
                ))}
                <Button size="sm" variant="secondary" onClick={() => addSection()} className="gap-1.5">
                  <Plus className="w-3 h-3" />
                  Custom
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel — Live Preview */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          <LivePreview sections={sections} totals={totals} />
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Section Card — collapsible configuration for one section
// ────────────────────────────────────────────────────────────────

interface SectionCardProps {
  section: SectionConfig;
  index: number;
  total: number;
  onUpdate: (patch: Partial<SectionConfig>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}

function SectionCard({ section, index, total, onUpdate, onRemove, onMove }: SectionCardProps) {
  const seatCount = section.rows * section.seatsPerRow;
  const potential = seatCount * section.price;

  return (
    <Card className="border-border/40 bg-card overflow-hidden">
      {/* Color accent */}
      <div className="h-1" style={{ backgroundColor: section.color }} />

      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex flex-col gap-0.5">
              {index > 0 && (
                <button
                  onClick={() => onMove(-1)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
              {index < total - 1 && (
                <button
                  onClick={() => onMove(1)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Input
              value={section.name}
              onChange={e => onUpdate({ name: e.target.value })}
              className="text-sm font-semibold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">
              {seatCount} seats
            </Badge>
            <button
              onClick={() => onUpdate({ collapsed: !section.collapsed })}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {section.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsed summary */}
        {section.collapsed && (
          <p className="text-xs text-muted-foreground">
            {section.rows} rows &middot; {section.seatsPerRow} seats/row &middot; {SEAT_TYPE_META[section.seatType].label} &middot; ${section.price}
          </p>
        )}

        {/* Expanded config */}
        <AnimatePresence>
          {!section.collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label className="text-xs">Rows</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={section.rows}
                    onChange={e => onUpdate({ rows: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Seats per row</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={section.seatsPerRow}
                    onChange={e => onUpdate({ seatsPerRow: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Seat type</Label>
                  <Select
                    value={section.seatType}
                    onValueChange={(v: SeatType) => onUpdate({ seatType: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEAT_TYPE_META).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Price ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    value={section.price}
                    onChange={e => onUpdate({ price: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div className="mt-3">
                <Label className="text-xs">Section color</Label>
                <div className="flex gap-1.5 mt-1">
                  {SECTION_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        section.color === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>{seatCount} seats</span>
                <span>${potential.toLocaleString()} potential revenue</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────
// Live Preview — real-time visual of the seat layout
// ────────────────────────────────────────────────────────────────

interface LivePreviewProps {
  sections: SectionConfig[];
  totals: { seats: number; revenue: number; sections: number };
}

function LivePreview({ sections, totals }: LivePreviewProps) {
  if (sections.length === 0) {
    return (
      <Card className="border-border/40 bg-card">
        <CardContent className="pt-6 pb-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Grid3X3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Add sections to see your seat map come to life
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card overflow-hidden">
      <CardContent className="pt-6">
        {/* Stage */}
        <div className="flex justify-center mb-6">
          <div className="px-12 py-2 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border border-primary/20 rounded-full">
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">Stage</span>
          </div>
        </div>

        {/* Sections with seats */}
        <div className="space-y-5">
          {sections.map(section => (
            <div key={section.id} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {section.name}
              </p>
              {Array.from({ length: section.rows }, (_, ri) => {
                const override = section.rowOverrides[ri];
                const seatType = override?.seatType || section.seatType;

                return (
                  <div key={ri} className="flex items-center gap-2">
                    <span className="w-5 text-[10px] font-mono text-muted-foreground text-right shrink-0">
                      {rowLetter(ri)}
                    </span>
                    <div className="flex gap-[3px] justify-center flex-1">
                      {Array.from({ length: section.seatsPerRow }, (_, si) => (
                        <div
                          key={si}
                          className="w-3 h-3 rounded-[2px] transition-colors"
                          style={{ backgroundColor: section.color, opacity: seatType === 'VIP' ? 1 : 0.7 }}
                          title={`${rowLetter(ri)}${si + 1} — ${SEAT_TYPE_META[seatType].label} — $${override?.price ?? section.price}`}
                        />
                      ))}
                    </div>
                    <span className="w-5 text-[10px] font-mono text-muted-foreground shrink-0">
                      {rowLetter(ri)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border/40 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
          {sections.map(section => (
            <span key={section.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: section.color }} />
              {section.name}
            </span>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {totals.seats} seats &middot; {totals.sections} section{totals.sections !== 1 ? 's' : ''}
          </span>
          <span className="font-medium text-foreground">
            ${totals.revenue.toLocaleString()} potential
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
