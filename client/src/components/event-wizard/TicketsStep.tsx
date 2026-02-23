import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Clock,
  Percent,
  Gift,
  AlertCircle,
  ChevronDown,
  EyeOff,
  Copy,
  Trash2,
} from 'lucide-react';
import type { StepComponentProps, TicketType, CurrencyOption } from './types';
import { CURRENCIES, DEFAULT_CURRENCY } from './types';

/* Segment colors for the capacity allocation bar */
const SEGMENT_COLORS = [
  'bg-primary',
  'bg-violet-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-sky-500',
];

interface TicketsStepProps extends StepComponentProps {
  ticketTypes: TicketType[];
  setTicketTypes: React.Dispatch<React.SetStateAction<TicketType[]>>;
}

export const TicketsStep: React.FC<TicketsStepProps> = ({
  eventData,
  onInputChange,
  validationErrors,
  ticketTypes,
  setTicketTypes,
}) => {
  const [detailsOpen, setDetailsOpen] = useState<Set<number>>(new Set());
  const [advancedOpen, setAdvancedOpen] = useState<Set<number>>(new Set());
  const [availabilityOpen, setAvailabilityOpen] = useState<Set<number>>(new Set());

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    id: number,
  ) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Handlers (logic unchanged) ── */

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Date.now(),
      name: '',
      description: '',
      type: 'paid',
      price: '0',
      quantity: '100',
      maxPerPerson: 10,
      salesChannel: 'both',
    };
    setTicketTypes([...ticketTypes, newTicket]);
  };

  const removeTicketType = (id: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((t) => t.id !== id));
      setDetailsOpen(prev => { const n = new Set(prev); n.delete(id); return n; });
      setAdvancedOpen(prev => { const n = new Set(prev); n.delete(id); return n; });
      setAvailabilityOpen(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const updateTicket = (index: number, updates: Partial<TicketType>) => {
    const next = [...ticketTypes];
    next[index] = { ...next[index], ...updates };
    setTicketTypes(next);
  };

  const duplicateTicket = (ticket: TicketType) => {
    setTicketTypes([...ticketTypes, { ...ticket, id: Date.now(), name: `${ticket.name} (Copy)` }]);
  };

  /* ── Derived values ── */

  const currency = eventData.currency || DEFAULT_CURRENCY;
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const hasPaidTickets = ticketTypes.some(t => t.type === 'paid' && !t.isComplementary);
  const ticketsError = validationErrors.tickets || '';

  const capacityNum = parseInt(eventData.capacity || '0', 10);
  const hasCapacity = !isNaN(capacityNum) && capacityNum > 0;

  const allocations = ticketTypes.map(t => ({
    id: t.id,
    name: t.name,
    qty: parseInt(t.quantity, 10) || 0,
  }));
  const totalAllocated = allocations.reduce((s, a) => s + a.qty, 0);
  const remaining = hasCapacity ? capacityNum - totalAllocated : 0;
  const overCapacity = hasCapacity && totalAllocated > capacityNum;
  const perfectFit = hasCapacity && totalAllocated === capacityNum;

  return (
    <div className="space-y-8">
      {/* Validation */}
      {ticketsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{ticketsError}</AlertDescription>
        </Alert>
      )}

      {/* ────────────────────────────────────────────
          Capacity Allocator
          ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <label className="text-sm font-medium text-foreground">
            Event Capacity
          </label>
          {hasCapacity && totalAllocated > 0 && (
            <span className={`text-sm tabular-nums ${
              overCapacity
                ? 'text-destructive font-medium'
                : perfectFit
                  ? 'text-success font-medium'
                  : 'text-muted-foreground'
            }`}>
              {totalAllocated.toLocaleString()} / {capacityNum.toLocaleString()} allocated
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={eventData.capacity || ''}
            placeholder="No limit"
            className="h-9 w-28 text-center tabular-nums"
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d+$/.test(v)) onInputChange('capacity', v);
            }}
          />
          <span className="text-sm text-muted-foreground">total spots</span>
        </div>

        {/* Allocation bar + legend */}
        {hasCapacity && totalAllocated > 0 && (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden flex gap-px">
              {allocations.map((a, i) => {
                if (a.qty <= 0) return null;
                const denom = overCapacity ? totalAllocated : capacityNum;
                const pct = (a.qty / denom) * 100;
                return (
                  <div
                    key={a.id}
                    className={`h-full transition-all duration-300 ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {allocations.map((a, i) => (
                <span key={a.id} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`} />
                  {a.name || `Ticket ${i + 1}`}
                  <span className="font-medium text-foreground tabular-nums">{a.qty.toLocaleString()}</span>
                </span>
              ))}
              {remaining > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-muted" />
                  Remaining
                  <span className="font-medium text-foreground tabular-nums">{remaining.toLocaleString()}</span>
                </span>
              )}
            </div>

            {overCapacity && (
              <p className="text-xs text-destructive">
                {Math.abs(remaining).toLocaleString()} over capacity — reduce ticket quantities or increase capacity
              </p>
            )}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────
          Currency (compact)
          ──────────────────────────────────────────── */}
      {hasPaidTickets && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Currency</label>
          <Select
            value={currency}
            onValueChange={(v) => onInputChange('currency', v)}
          >
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c: CurrencyOption) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ────────────────────────────────────────────
          Ticket Cards
          ──────────────────────────────────────────── */}
      <div className="space-y-5">
        {ticketTypes.map((ticket, index) => {
          const nameError = ticketsError && !ticket.name.trim();
          const priceError = ticketsError && ticket.type === 'paid' && !ticket.isComplementary && (!ticket.price || parseFloat(ticket.price) < 0);

          return (
            <div
              key={ticket.id}
              className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-card"
            >
              <div className="p-5 space-y-5">

                {/* ── Identity: Name + Type ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Ticket Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g., General Admission, VIP, Early Bird"
                      value={ticket.name}
                      className={`h-11 ${nameError ? 'border-destructive' : ''}`}
                      onChange={(e) => updateTicket(index, { name: e.target.value })}
                    />
                    {nameError && (
                      <p className="text-xs text-destructive">Ticket name is required</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={ticket.type}
                      onValueChange={(v: 'free' | 'paid') => {
                        updateTicket(index, { type: v, price: v === 'free' ? '0' : ticket.price });
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Numbers: Price + Quantity ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ticket.type === 'paid' && !ticket.isComplementary ? (
                    <div className="space-y-1.5">
                      <Label>Price <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={ticket.price}
                          className={`h-11 pl-12 ${priceError ? 'border-destructive' : ''}`}
                          onChange={(e) => updateTicket(index, { price: e.target.value })}
                        />
                      </div>
                      {priceError && (
                        <p className="text-xs text-destructive">Enter a valid price</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Price</Label>
                      <div className="h-11 flex items-center">
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          ticket.isComplementary
                            ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {ticket.isComplementary ? 'Complementary' : 'Free'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="100"
                      value={ticket.quantity}
                      className="h-11"
                      onChange={(e) => updateTicket(index, { quantity: e.target.value })}
                    />
                  </div>
                </div>

                {/* ── Details toggle ── */}
                {(() => {
                  const hasDetails = !!(ticket.description?.trim()) || ticket.isComplementary || !!ticket.originalPrice || ticket.isHidden || (ticket.salesChannel && ticket.salesChannel !== 'both') || ticket.availableFrom || ticket.availableUntil;
                  const isOpen = detailsOpen.has(ticket.id);

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => toggle(setDetailsOpen, ticket.id)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        <span>{isOpen ? 'Hide details' : 'Details & options'}</span>
                        {!isOpen && hasDetails && (
                          <span className="text-xs text-primary ml-0.5">· Configured</span>
                        )}
                      </button>

                      {isOpen && (
                        <div className="space-y-5 pt-2">
                          {/* Description */}
                          <div className="space-y-1.5">
                            <Label className="text-muted-foreground">Description</Label>
                            <Textarea
                              placeholder="What's included with this ticket?"
                              value={ticket.description || ''}
                              className="min-h-[70px] resize-none"
                              onChange={(e) => updateTicket(index, { description: e.target.value })}
                            />
                          </div>

                          {/* Paid-ticket options */}
                          {ticket.type === 'paid' && (
                            <div className="space-y-3">
                              {/* Complementary */}
                              <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2.5">
                                  <Gift className="h-4 w-4 text-purple-500" />
                                  <div>
                                    <p className="text-sm font-medium">Complementary ticket</p>
                                    <p className="text-xs text-muted-foreground">Invitation-only for VIPs, speakers, sponsors</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={ticket.isComplementary || false}
                                  onCheckedChange={(checked) => {
                                    updateTicket(index, {
                                      isComplementary: checked,
                                      requiresInvitation: checked,
                                      price: checked ? '0' : ticket.price,
                                    });
                                  }}
                                />
                              </div>

                              {/* Discount (only when not complementary) */}
                              {!ticket.isComplementary && (
                                <>
                                  <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2.5">
                                      <Percent className="h-4 w-4 text-emerald-500" />
                                      <div>
                                        <p className="text-sm font-medium">Show discounted price</p>
                                        <p className="text-xs text-muted-foreground">Original price with strikethrough</p>
                                      </div>
                                    </div>
                                    <Switch
                                      checked={!!ticket.originalPrice}
                                      onCheckedChange={(checked) => {
                                        updateTicket(index, {
                                          originalPrice: checked ? ticket.price : undefined,
                                          discountLabel: checked ? ticket.discountLabel : undefined,
                                        });
                                      }}
                                    />
                                  </div>

                                  {/* Discount details */}
                                  {ticket.originalPrice && (
                                    <div className="ml-1 pl-4 border-l-2 border-primary/20 space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                          <Label className="text-xs text-muted-foreground">Original</Label>
                                          <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              placeholder="149.99"
                                              value={ticket.originalPrice}
                                              className="h-10 pl-10 text-sm"
                                              onChange={(e) => updateTicket(index, { originalPrice: e.target.value })}
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs text-muted-foreground">Sale price</Label>
                                          <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              placeholder="99.99"
                                              value={ticket.price}
                                              className="h-10 pl-10 text-sm"
                                              onChange={(e) => updateTicket(index, { price: e.target.value })}
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {ticket.price &&
                                        parseFloat(ticket.originalPrice) > parseFloat(ticket.price) && (
                                          <div className="flex items-center gap-2">
                                            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-xs">
                                              {Math.round(((parseFloat(ticket.originalPrice) - parseFloat(ticket.price)) / parseFloat(ticket.originalPrice)) * 100)}% OFF
                                            </Badge>
                                            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                              Save {currencySymbol} {(parseFloat(ticket.originalPrice) - parseFloat(ticket.price)).toFixed(2)}
                                            </span>
                                          </div>
                                        )}

                                      <Input
                                        placeholder="Label — e.g., Early Bird, Flash Sale"
                                        value={ticket.discountLabel || ''}
                                        className="h-10 text-sm"
                                        onChange={(e) => updateTicket(index, { discountLabel: e.target.value })}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Purchase limits */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Max per person</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                placeholder="10"
                                value={ticket.maxPerPerson || ''}
                                className="h-10"
                                onChange={(e) => updateTicket(index, {
                                  maxPerPerson: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Min per order</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                placeholder="1"
                                value={ticket.minPerOrder || ''}
                                className="h-10"
                                onChange={(e) => updateTicket(index, {
                                  minPerOrder: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                              />
                            </div>
                          </div>

                          {/* Nested expandable sections */}
                          <div className="space-y-1">
                            {/* Availability window (paid only) */}
                            {ticket.type === 'paid' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggle(setAvailabilityOpen, ticket.id)}
                                  className="flex items-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                    availabilityOpen.has(ticket.id) ? 'rotate-180' : ''
                                  }`} />
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Availability window</span>
                                  {(ticket.availableFrom || ticket.availableUntil) && (
                                    <span className="text-xs text-primary ml-0.5">· Set</span>
                                  )}
                                </button>

                                {availabilityOpen.has(ticket.id) && (
                                  <div className="pl-5 pb-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">From</Label>
                                        <Input
                                          type="datetime-local"
                                          value={ticket.availableFrom || ''}
                                          className="h-10 text-sm"
                                          onChange={(e) => updateTicket(index, { availableFrom: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Until</Label>
                                        <Input
                                          type="datetime-local"
                                          value={ticket.availableUntil || ''}
                                          className="h-10 text-sm"
                                          onChange={(e) => updateTicket(index, { availableUntil: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Early bird limit</Label>
                                      <Input
                                        type="number"
                                        placeholder="e.g., First 50 at this price"
                                        value={ticket.earlyBirdQuantity || ''}
                                        className="h-10 text-sm"
                                        onChange={(e) => updateTicket(index, { earlyBirdQuantity: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* More options */}
                            <button
                              type="button"
                              onClick={() => toggle(setAdvancedOpen, ticket.id)}
                              className="flex items-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                advancedOpen.has(ticket.id) ? 'rotate-180' : ''
                              }`} />
                              <span>More options</span>
                              {(ticket.isHidden || (ticket.salesChannel && ticket.salesChannel !== 'both')) && (
                                <span className="text-xs text-primary ml-0.5">· Set</span>
                              )}
                            </button>

                            {advancedOpen.has(ticket.id) && (
                              <div className="pl-5 pb-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Sales channel</Label>
                                    <Select
                                      value={ticket.salesChannel || 'both'}
                                      onValueChange={(v: 'online' | 'door' | 'both') => {
                                        updateTicket(index, { salesChannel: v });
                                      }}
                                    >
                                      <SelectTrigger className="h-10">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="both">Online & At Door</SelectItem>
                                        <SelectItem value="online">Online Only</SelectItem>
                                        <SelectItem value="door">At Door Only</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Visibility</Label>
                                    <div className="flex items-center justify-between h-10 px-3 border border-gray-200 dark:border-zinc-800 rounded-md">
                                      <span className="text-sm">
                                        {ticket.isHidden ? 'Hidden' : 'Visible'}
                                      </span>
                                      <Switch
                                        checked={!ticket.isHidden}
                                        onCheckedChange={(checked) => updateTicket(index, { isHidden: !checked })}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {ticket.isHidden && (
                                  <p className="text-xs text-muted-foreground">
                                    Only accessible via promo code or direct link
                                  </p>
                                )}

                                {ticket.isComplementary && (
                                  <div className="flex items-center gap-2.5 py-1">
                                    <Checkbox
                                      id={`inv-${ticket.id}`}
                                      checked={ticket.requiresInvitation || false}
                                      onCheckedChange={(checked) => updateTicket(index, { requiresInvitation: !!checked })}
                                    />
                                    <Label htmlFor={`inv-${ticket.id}`} className="text-sm cursor-pointer">
                                      Requires invitation to claim
                                    </Label>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ── Footer actions ── */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => duplicateTicket(ticket)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    Duplicate
                  </button>
                  {ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketType(ticket.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add ticket */}
        <button
          type="button"
          onClick={addTicketType}
          className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add ticket type
        </button>
      </div>

      {/* ── Platform note (single sentence, not two giant cards) ── */}
      {hasPaidTickets && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          Service fees and refund policies are managed at the platform level.{' '}
          <a
            href="mailto:support@eventknit.com?subject=Custom%20Pricing%20Inquiry"
            className="text-primary hover:underline"
          >
            Contact support
          </a>{' '}
          for custom arrangements.
        </p>
      )}
    </div>
  );
};
