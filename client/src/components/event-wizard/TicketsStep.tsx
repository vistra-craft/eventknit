import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  X,
  Clock,
  Percent,
  Gift,
  AlertCircle,
  Tag,
  Users,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronUp,
  Ticket,
  Eye,
  EyeOff,
  Copy,
  Info,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import type { StepComponentProps, TicketType, CurrencyOption } from './types';
import { CURRENCIES, DEFAULT_CURRENCY } from './types';

interface TicketsStepProps extends StepComponentProps {
  ticketTypes: TicketType[];
  setTicketTypes: React.Dispatch<React.SetStateAction<TicketType[]>>;
}

export const TicketsStep: React.FC<TicketsStepProps> = ({
  eventData,
  onInputChange,
  validationErrors,
  setValidationErrors,
  ticketTypes,
  setTicketTypes,
}) => {
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set());

  const toggleTicketExpand = (id: number) => {
    setExpandedTickets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
    setExpandedTickets(prev => new Set(prev).add(newTicket.id));
  };

  const removeTicketType = (id: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((ticket) => ticket.id !== id));
      setExpandedTickets(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const updateTicket = (index: number, updates: Partial<TicketType>) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[index] = { ...updatedTickets[index], ...updates };
    setTicketTypes(updatedTickets);
  };

  const duplicateTicket = (ticket: TicketType) => {
    const newTicket: TicketType = {
      ...ticket,
      id: Date.now(),
      name: `${ticket.name} (Copy)`,
    };
    setTicketTypes([...ticketTypes, newTicket]);
  };

  const currency = eventData.currency || DEFAULT_CURRENCY;
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const hasPaidTickets = ticketTypes.some(t => t.type === 'paid' && !t.isComplementary);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Ticket Setup
        </h2>
        <p className="text-muted-foreground">
          Configure your ticket types, pricing, and purchase options.
        </p>
      </div>

      {validationErrors.tickets && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationErrors.tickets}</AlertDescription>
        </Alert>
      )}

      {/* Currency Selection */}
      {hasPaidTickets && (
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label className="text-base font-medium">Currency</Label>
                <p className="text-sm text-muted-foreground">
                  Select the currency for all ticket prices
                </p>
              </div>
              <Select
                value={currency}
                onValueChange={(value) => onInputChange('currency', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr: CurrencyOption) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Types */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Ticket Types
          </h3>
          <Badge variant="secondary">{ticketTypes.length} ticket{ticketTypes.length !== 1 ? 's' : ''}</Badge>
        </div>

        {ticketTypes.map((ticket, index) => (
          <Card
            key={ticket.id}
            className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {/* Ticket Header - Always Visible */}
            <div
              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleTicketExpand(ticket.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${ticket.type === 'free' ? 'bg-success' : ticket.isComplementary ? 'bg-purple-500' : 'bg-primary'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">
                        {ticket.name || `Ticket Type ${index + 1}`}
                      </h4>
                      {ticket.isHidden && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                      {ticket.isComplementary && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          <Gift className="h-3 w-3 mr-1" />
                          Complementary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ticket.type === 'free' ? 'Free' : ticket.isComplementary ? 'Invitation Only' : `${currencySymbol} ${ticket.price || '0'}`}
                      {' • '}
                      {ticket.quantity || 0} available
                      {ticket.maxPerPerson ? ` • Max ${ticket.maxPerPerson} per person` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ticketTypes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTicketType(ticket.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {expandedTickets.has(ticket.id) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedTickets.has(ticket.id) && (
              <CardContent className="pt-0 pb-6 space-y-6 border-t">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Ticket Name *</Label>
                    <Input
                      placeholder="e.g., General Admission, VIP, Early Bird"
                      value={ticket.name}
                      className="h-11"
                      onChange={(e) => updateTicket(index, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ticket Type</Label>
                    <Select
                      value={ticket.type}
                      onValueChange={(value: 'free' | 'paid') => {
                        updateTicket(index, {
                          type: value,
                          price: value === 'free' ? '0' : ticket.price,
                        });
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Describe what's included with this ticket, e.g., 'Includes access to all sessions, lunch, and networking events'"
                    value={ticket.description || ''}
                    className="min-h-[80px] resize-none"
                    onChange={(e) => updateTicket(index, { description: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps attendees understand the value of this ticket
                  </p>
                </div>

                {/* Pricing Section */}
                {ticket.type === 'paid' && (
                  <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
                    {/* Complementary Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gift className="h-5 w-5 text-purple-500" />
                        <div>
                          <Label className="text-sm font-medium">Complementary Ticket</Label>
                          <p className="text-xs text-muted-foreground">
                            For VIPs, speakers, sponsors — issued via invitation
                          </p>
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
                        <Separator />

                        {/* Discount Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Percent className="h-5 w-5 text-success" />
                            <div>
                              <Label className="text-sm font-medium">Show Discounted Price</Label>
                              <p className="text-xs text-muted-foreground">
                                Display original price with strikethrough
                              </p>
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

                        {/* Price Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ticket.originalPrice ? (
                            <>
                              <div className="space-y-2">
                                <Label>Original Price</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                    {currencySymbol}
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="149.99"
                                    value={ticket.originalPrice}
                                    className="h-11 pl-12"
                                    onChange={(e) => updateTicket(index, { originalPrice: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Sale Price</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                    {currencySymbol}
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="99.99"
                                    value={ticket.price}
                                    className="h-11 pl-12"
                                    onChange={(e) => updateTicket(index, { price: e.target.value })}
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <Label>Price</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                  {currencySymbol}
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="99.99"
                                  value={ticket.price}
                                  className="h-11 pl-12"
                                  onChange={(e) => updateTicket(index, { price: e.target.value })}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Discount Preview */}
                        {ticket.originalPrice && ticket.price &&
                          parseFloat(ticket.originalPrice) > parseFloat(ticket.price) && (
                            <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-success text-white">
                                    {Math.round(((parseFloat(ticket.originalPrice) - parseFloat(ticket.price)) / parseFloat(ticket.originalPrice)) * 100)}% OFF
                                  </Badge>
                                  <span className="text-sm text-success font-medium">
                                    Save {currencySymbol} {(parseFloat(ticket.originalPrice) - parseFloat(ticket.price)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Discount Label */}
                        {ticket.originalPrice && (
                          <div className="space-y-2">
                            <Label>Discount Label</Label>
                            <Input
                              placeholder="e.g., Early Bird, Student Discount, Flash Sale"
                              value={ticket.discountLabel || ''}
                              className="h-11"
                              onChange={(e) => updateTicket(index, { discountLabel: e.target.value })}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Quantity & Limits */}
                <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <Label className="text-sm font-medium">Quantity & Purchase Limits</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Total Available</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="100"
                        value={ticket.quantity}
                        className="h-11"
                        onChange={(e) => updateTicket(index, { quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Max Per Person</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="10"
                        value={ticket.maxPerPerson || ''}
                        className="h-11"
                        onChange={(e) => updateTicket(index, {
                          maxPerPerson: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Min Per Order</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="1"
                        value={ticket.minPerOrder || ''}
                        className="h-11"
                        onChange={(e) => updateTicket(index, {
                          minPerOrder: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Availability Window */}
                {ticket.type === 'paid' && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-xl hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <p className="text-sm font-medium">Availability Window</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.availableFrom || ticket.availableUntil
                                ? 'Custom availability set'
                                : 'Available until event starts'}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4 px-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Available From</Label>
                          <Input
                            type="datetime-local"
                            value={ticket.availableFrom || ''}
                            className="h-11"
                            onChange={(e) => updateTicket(index, { availableFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Available Until</Label>
                          <Input
                            type="datetime-local"
                            value={ticket.availableUntil || ''}
                            className="h-11"
                            onChange={(e) => updateTicket(index, { availableUntil: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Early Bird Quantity Limit</Label>
                        <Input
                          type="number"
                          placeholder="e.g., First 50 tickets at this price"
                          value={ticket.earlyBirdQuantity || ''}
                          className="h-11"
                          onChange={(e) => updateTicket(index, { earlyBirdQuantity: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          After this quantity sells, ticket becomes unavailable (use another ticket type for regular pricing)
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Advanced Options */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-xl hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">Advanced Options</p>
                          <p className="text-xs text-muted-foreground">
                            Sales channel, visibility, and more
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Sales Channel</Label>
                        <Select
                          value={ticket.salesChannel || 'both'}
                          onValueChange={(value: 'online' | 'door' | 'both') => {
                            updateTicket(index, { salesChannel: value });
                          }}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Online & At Door</SelectItem>
                            <SelectItem value="online">Online Only</SelectItem>
                            <SelectItem value="door">At Door Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Visibility</Label>
                        <div className="flex items-center justify-between h-11 px-3 border rounded-md">
                          <span className="text-sm">
                            {ticket.isHidden ? 'Hidden (Promo code only)' : 'Visible to all'}
                          </span>
                          <Switch
                            checked={!ticket.isHidden}
                            onCheckedChange={(checked) => updateTicket(index, { isHidden: !checked })}
                          />
                        </div>
                      </div>
                    </div>

                    {ticket.isComplementary && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <Checkbox
                          id={`requires-invite-${ticket.id}`}
                          checked={ticket.requiresInvitation || false}
                          onCheckedChange={(checked) => updateTicket(index, { requiresInvitation: !!checked })}
                        />
                        <Label htmlFor={`requires-invite-${ticket.id}`} className="text-sm">
                          Requires invitation to claim
                        </Label>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Ticket Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateTicket(ticket)}
                    className="text-muted-foreground"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addTicketType}
          className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:border-primary h-12"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Ticket Type
        </Button>
      </div>

      {/* Capacity Validation */}
      {eventData.capacity && eventData.capacity.trim() !== '' && (() => {
        const capacity = parseInt(eventData.capacity, 10);
        const totalTicketQuantity = ticketTypes.reduce((sum, ticket) => {
          const qty = parseInt(ticket.quantity, 10);
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0);

        if (!isNaN(capacity) && capacity > 0 && totalTicketQuantity > 0) {
          const matches = totalTicketQuantity === capacity;
          return (
            <Card className={`border-2 ${matches ? 'border-success/50 bg-success/5' : 'border-warning/50 bg-warning/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${matches ? 'bg-success/20' : 'bg-warning/20'}`}>
                    {matches ? (
                      <ShieldCheck className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {matches ? 'Capacity matches ticket quantities' : 'Capacity mismatch'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Event Capacity: <strong>{capacity}</strong> • Total Tickets: <strong>{totalTicketQuantity}</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      <Separator className="my-8" />

      {/* Promo Codes Section - Links to dedicated manager */}
      <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Promo Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Create discount codes after publishing your event
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/organizer/marketing/promo-codes', '_blank')}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              Manage Codes
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Promo codes are managed separately in the Marketing section.
              You can create event-specific or organizer-wide codes, set usage limits,
              validity dates, and track redemptions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Service Fees & Refund Policy - Platform Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Fees Info Card */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Service Fees</h3>
                <p className="text-sm text-muted-foreground">Platform-wide setting</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Service fees are configured at the platform level by our team.
                  A standard processing fee applies to all paid ticket sales.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => window.location.href = 'mailto:support@eventknit.com?subject=Service%20Fee%20Inquiry'}
            >
              <Mail className="h-4 w-4" />
              Contact Support for Custom Rates
            </Button>
          </CardContent>
        </Card>

        {/* Refund Policy Info Card */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Refund Policy</h3>
                <p className="text-sm text-muted-foreground">Platform-wide setting</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Refund policies are governed by our platform terms. Attendees can
                  request refunds through our support team based on the event's circumstances.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => window.location.href = 'mailto:support@eventknit.com?subject=Refund%20Policy%20Inquiry'}
            >
              <Mail className="h-4 w-4" />
              Contact Support for Custom Policy
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Platform Policy Notice */}
      <Alert className="mt-6 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Need custom arrangements?</strong> Enterprise organizers can request custom
          service fee rates and refund policies. Our team will reach out to discuss options
          tailored to your event needs.
        </AlertDescription>
      </Alert>
    </div>
  );
};
