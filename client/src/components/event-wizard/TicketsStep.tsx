import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';


import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Clock,
  Percent,
  Gift,


  ChevronDown,
  Copy,
  Trash2,
  Ticket,
  Crown,
  Zap,
  GraduationCap,
  DoorOpen,
  Users,
  ShieldCheck,
  Ban,
  RefreshCw,
  FileText,
} from 'lucide-react';
import type { StepComponentProps, TicketType, CurrencyOption } from './types';
import { CURRENCIES, DEFAULT_CURRENCY } from './types';
import { SeatingConfigurationSection, type SeatingConfig } from '../organizer/SeatingConfigurationSection';

const SEGMENT_COLORS = [
  'bg-primary',
  'bg-violet-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-sky-500',
];

const TICKET_TEMPLATES: { label: string; icon: React.ReactNode; ticket: Partial<TicketType> }[] = [
  {
    label: 'General Admission',
    icon: <Ticket className="h-3.5 w-3.5" />,
    ticket: { name: 'General Admission', type: 'paid', price: '0', quantity: '100', maxPerPerson: 10, salesChannel: 'both' },
  },
  {
    label: 'VIP',
    icon: <Crown className="h-3.5 w-3.5" />,
    ticket: { name: 'VIP', type: 'paid', price: '0', quantity: '50', maxPerPerson: 5, salesChannel: 'both' },
  },
  {
    label: 'Early Bird',
    icon: <Zap className="h-3.5 w-3.5" />,
    ticket: { name: 'Early Bird', type: 'paid', price: '0', quantity: '100', maxPerPerson: 10, discountLabel: 'Early Bird', salesChannel: 'online' },
  },
  {
    label: 'Student',
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    ticket: { name: 'Student / Concession', type: 'paid', price: '0', quantity: '50', maxPerPerson: 5, salesChannel: 'both' },
  },
  {
    label: 'Free Entry',
    icon: <DoorOpen className="h-3.5 w-3.5" />,
    ticket: { name: 'Free Entry', type: 'free', price: '0', quantity: '200', maxPerPerson: 10, salesChannel: 'both' },
  },
  {
    label: 'Complimentary',
    icon: <Users className="h-3.5 w-3.5" />,
    ticket: { name: 'Speaker / Staff Pass', type: 'paid', price: '0', quantity: '20', maxPerPerson: 1, isComplementary: true, requiresInvitation: true, salesChannel: 'both' },
  },
];

const REFUND_POLICY_TEMPLATES: {
  value: string;
  label: string;
  description: string;
  icon: typeof Ban;
  defaultDays?: number;
}[] = [
  {
    value: 'no_refunds',
    label: 'No Refunds',
    description: 'All ticket sales are final. No refunds will be issued.',
    icon: Ban,
    defaultDays: 0,
  },
  {
    value: 'full_refund',
    label: 'Full Refund',
    description: '100% refund if requested before the deadline.',
    icon: RefreshCw,
    defaultDays: 7,
  },
  {
    value: 'partial_refund',
    label: 'Partial Refund (50%)',
    description: '50% refund if requested before the deadline.',
    icon: ShieldCheck,
    defaultDays: 7,
  },
  {
    value: 'custom',
    label: 'Custom Policy',
    description: 'Write your own refund terms for this event.',
    icon: FileText,
  },
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

  const addTicketType = (template?: Partial<TicketType>) => {
    const newTicket: TicketType = {
      id: Date.now(),
      name: template?.name || '',
      description: template?.description || '',
      type: template?.type || 'paid',
      price: template?.price || '0',
      quantity: template?.quantity || '100',
      maxPerPerson: template?.maxPerPerson ?? 10,
      salesChannel: template?.salesChannel || 'both',
      isComplementary: template?.isComplementary,
      requiresInvitation: template?.requiresInvitation,
      discountLabel: template?.discountLabel,
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

  const currency = eventData.currency || DEFAULT_CURRENCY;
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const hasPaidTickets = ticketTypes.some(t => t.type === 'paid' && !t.isComplementary);
  const ticketsError = validationErrors.tickets || '';

  const capacityNum = parseInt(eventData.capacity || '0', 10);
  const hasCapacity = !isNaN(capacityNum) && capacityNum > 0;
  const allocations = ticketTypes.map(t => ({
    id: t.id, name: t.name, qty: parseInt(t.quantity, 10) || 0,
  }));
  const totalAllocated = allocations.reduce((s, a) => s + a.qty, 0);
  const remaining = hasCapacity ? capacityNum - totalAllocated : 0;
  const overCapacity = hasCapacity && totalAllocated > capacityNum;
  const perfectFit = hasCapacity && totalAllocated === capacityNum;

  return (
    <div className="space-y-6">

      {/* ── Capacity Allocator ── */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <label className="text-sm font-medium text-foreground">Event Capacity</label>
          {hasCapacity && totalAllocated > 0 && (
            <span className={`text-sm tabular-nums ${
              overCapacity ? 'text-destructive font-medium' : perfectFit ? 'text-success font-medium' : 'text-muted-foreground'
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

        {validationErrors.capacity && (
          <p className="text-xs text-destructive">{validationErrors.capacity}</p>
        )}

        {hasCapacity && totalAllocated > 0 && (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden flex gap-px">
              {allocations.map((a, i) => {
                if (a.qty <= 0) return null;
                const denom = overCapacity ? totalAllocated : capacityNum;
                return (
                  <div
                    key={a.id}
                    className={`h-full transition-all duration-300 ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}
                    style={{ width: `${(a.qty / denom) * 100}%` }}
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

      {/* ── Currency ── */}
      {hasPaidTickets && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Currency</label>
          <Select value={currency} onValueChange={(v) => onInputChange('currency', v)}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c: CurrencyOption) => (
                <SelectItem key={c.code} value={c.code}>{c.symbol} - {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Quick-add templates ── */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">Quick add:</span>
        {TICKET_TEMPLATES.map((tpl) => (
          <Button
            key={tpl.label}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => addTicketType(tpl.ticket)}
          >
            {tpl.icon}
            {tpl.label}
          </Button>
        ))}
      </div>

      {/* ── Ticket Cards ── */}
      <div className="space-y-3">
        {ticketTypes.map((ticket, index) => {
          const nameError = ticketsError && !ticket.name.trim();
          const priceError = ticketsError && ticket.type === 'paid' && !ticket.isComplementary && (!ticket.price || parseFloat(ticket.price) <= 0);
          const isOpen = detailsOpen.has(ticket.id);
          const hasDetails = !!(ticket.description?.trim()) || ticket.isComplementary || !!ticket.originalPrice || ticket.isHidden || (ticket.salesChannel && ticket.salesChannel !== 'both') || ticket.availableFrom || ticket.availableUntil;

          const hasError = nameError || priceError;

          return (
            <div
              key={ticket.id}
              data-ticket-card
              className={`rounded-xl border bg-card p-4 transition-colors ${
                hasError
                  ? 'border-destructive/40'
                  : 'border-gray-200 dark:border-zinc-800'
              }`}
            >
              {/* ── Compact row: 4 core fields ── */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-[1fr_6.5rem_8.5rem_6rem]">
                {/* Name */}
                <div className="col-span-2 md:col-span-1 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    Name <span className="text-destructive">*</span>
                  </span>
                  <Input
                    placeholder="e.g., General Admission"
                    value={ticket.name}
                    className={`h-9 text-sm ${nameError ? 'border-destructive' : ''}`}
                    onChange={(e) => updateTicket(index, { name: e.target.value })}
                  />
                </div>

                {/* Type */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">Type</span>
                  <Select
                    value={ticket.type}
                    onValueChange={(v: 'free' | 'paid') => {
                      updateTicket(index, { type: v, price: v === 'free' ? '0' : ticket.price });
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    Price{ticket.type === 'paid' && !ticket.isComplementary && <span className="text-destructive"> *</span>}
                  </span>
                  {ticket.type === 'paid' && !ticket.isComplementary ? (
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={ticket.price}
                        className={`h-9 pl-9 text-sm ${priceError ? 'border-destructive' : ''}`}
                        onChange={(e) => {
                          const nextPrice = e.target.value;
                          const numericPrice = parseFloat(nextPrice);
                          if (!isNaN(numericPrice) && numericPrice === 0) {
                            updateTicket(index, { price: nextPrice, type: 'free' });
                            return;
                          }
                          updateTicket(index, { price: nextPrice });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-9 flex items-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ticket.isComplementary
                          ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {ticket.isComplementary ? 'Comp.' : 'Free'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Qty */}
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">Qty</span>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={ticket.quantity}
                    className="h-9 text-sm"
                    onChange={(e) => updateTicket(index, { quantity: e.target.value })}
                  />
                </div>
              </div>

              {/* Inline errors */}
              {(nameError || priceError) && (
                <div className="flex flex-wrap gap-x-4 mt-1.5">
                  {nameError && <p className="text-[11px] text-muted-foreground">Give this ticket a name</p>}
                  {priceError && <p className="text-[11px] text-muted-foreground">Set a price above 0, or switch to Free</p>}
                </div>
              )}

              {/* ── Meta row: toggle left, actions right ── */}
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={() => toggle(setDetailsOpen, ticket.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  <span>{isOpen ? 'Hide details' : 'Details & options'}</span>
                  {!isOpen && hasDetails && (
                    <span className="text-[10px] text-primary ml-0.5">· Configured</span>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => duplicateTicket(ticket)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>
                  {ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketType(ticket.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Expanded details panel ── */}
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/60 space-y-5">
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

                          {ticket.originalPrice && (
                            <div className="ml-1 pl-4 border-l-2 border-primary/20 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Original</Label>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="149.99"
                                      value={ticket.originalPrice}
                                      className="h-10 pl-9 text-sm"
                                      onChange={(e) => updateTicket(index, { originalPrice: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Sale price</Label>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="99.99"
                                      value={ticket.price}
                                      className="h-10 pl-9 text-sm"
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
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => addTicketType()}
          className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add ticket type
        </button>
      </div>

      {/* ── Seating Configuration ── */}
      <SeatingConfigurationSection
        config={{
          hasSeatingMap: eventData.hasSeatingMap || false,
          seatingType: (eventData.seatingType || '') as SeatingConfig['seatingType'],
          seatMapRequired: eventData.seatMapRequired || false,
        }}
        onConfigChange={(updates) => {
          Object.entries(updates).forEach(([key, value]) => {
            onInputChange(key, value);
          });
        }}
      />

      {/* ── Refund Policy ── */}
      {hasPaidTickets && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium text-foreground">Refund Policy</label>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose a refund policy for this event. This will be shown to attendees during checkout and on their tickets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REFUND_POLICY_TEMPLATES.map((tpl) => {
              const isSelected = (eventData.refundPolicy || 'no_refunds') === tpl.value;
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.value}
                  type="button"
                  onClick={() => {
                    onInputChange('refundPolicy', tpl.value);
                    if (tpl.defaultDays !== undefined) {
                      onInputChange('refundDeadlineDays', tpl.defaultDays);
                    }
                    if (tpl.value !== 'custom') {
                      onInputChange('refundPolicyText', '');
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {tpl.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Deadline days — show for full_refund and partial_refund */}
          {(eventData.refundPolicy === 'full_refund' || eventData.refundPolicy === 'partial_refund') && (
            <div className="flex items-center gap-3 pl-1">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Refund deadline</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={eventData.refundDeadlineDays || ''}
                placeholder="7"
                className="h-9 w-20 text-center tabular-nums"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d+$/.test(v)) onInputChange('refundDeadlineDays', v ? parseInt(v) : 0);
                }}
              />
              <span className="text-sm text-muted-foreground">days before event</span>
            </div>
          )}

          {/* Custom policy text */}
          {eventData.refundPolicy === 'custom' && (
            <div className="space-y-1.5 pl-1">
              <Label className="text-sm text-muted-foreground">Custom refund policy</Label>
              <Textarea
                placeholder="Describe your refund policy. E.g., Full refund up to 14 days before the event. 50% refund up to 7 days before. No refunds after that."
                value={eventData.refundPolicyText || ''}
                className="min-h-[80px] resize-none text-sm"
                onChange={(e) => onInputChange('refundPolicyText', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">This text will be displayed to attendees on the event page and in their confirmation email.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
