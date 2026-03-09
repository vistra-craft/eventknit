import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Percent,
  Plus,
  Trash2,
  Clock,
  TrendingUp,
  Users,
  Calculator,
} from "lucide-react";
import {
  createPricingRule,
  getEventPricingRules,
  calculateDynamicPrice,
  deletePricingRule,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from '@/lib/utils/error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useParams } from "react-router-dom";

interface PricingRule {
  id: string;
  name: string;
  type: "time_based" | "demand_based" | "group_discount" | "loyalty";
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  priority: number;
  isActive: boolean;
}

interface PriceCalculation {
  finalPrice: number;
  originalPrice: number;
  discount?: number;
  appliedRules: string[];
}

type CreateRulePayload = {
  name: string;
  type: PricingRule["type"];
  priority: number;
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  applicableTicketTypes?: string[];
};

const DynamicPricing = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [confirmDeleteRule, setConfirmDeleteRule] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const response = await getEventPricingRules(eventId);
      if (response.success && response.data) {
        setRules(response.data.rules || []);
      }
    } catch (error) {
      console.error("Error fetching pricing rules:", error);
      showErrorToast(toast, error, 'Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    if (eventId) {
      fetchRules();
    }
  }, [eventId, fetchRules]);

  const handleCreateRule = async (data: CreateRulePayload) => {
    if (!eventId) return;
    try {
      const response = await createPricingRule({ ...data, eventId });
      if (response.success) {
        toast({
          title: "Success",
          description: "Pricing rule created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchRules();
      }
    } catch (error) {
      console.error("Error creating pricing rule:", error);
      showErrorToast(toast, error, 'Failed to create pricing rule');
    }
  };

  const handleCalculatePrice = async (ticketType: string, quantity: number) => {
    if (!eventId) return;
    try {
      const response = await calculateDynamicPrice(eventId, ticketType, quantity);
      if (response.success && response.data) {
        setPriceCalculation(response.data as PriceCalculation);
        setIsCalculatorOpen(true);
      }
    } catch (error) {
      console.error("Error calculating price:", error);
      showErrorToast(toast, error, 'Failed to calculate price');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const response = await deletePricingRule(ruleId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Pricing rule deleted successfully",
        });
        fetchRules();
      }
  } catch (error) {
    console.error("Error deleting rule:", error);
    showErrorToast(toast, error, 'Failed to delete pricing rule');
  }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      time_based: "Time-Based",
      demand_based: "Demand-Based",
      group_discount: "Group Discount",
      loyalty: "Loyalty",
    };
    return labels[type] || type;
  };

  if (!eventId) {
    return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Event ID is required</p>
          </CardContent>
        </Card>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dynamic Pricing</h1>
            <p className="text-muted-foreground mt-1">
              Create pricing rules for time-based, demand-based, and group discounts
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calculator className="h-4 w-4 mr-2" />
                  Price Calculator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Price Calculator</DialogTitle>
                </DialogHeader>
                <PriceCalculatorForm onSubmit={handleCalculatePrice} />
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Pricing Rule</DialogTitle>
                </DialogHeader>
                <CreateRuleForm
                  onSubmit={handleCreateRule}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {priceCalculation && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Calculated Price</p>
                  <p className="text-2xl font-bold">
                    ${priceCalculation.finalPrice.toFixed(2)}
                  </p>
                  {priceCalculation.discount && (
                    <p className="text-sm text-success">
                      Saved: ${priceCalculation.discount.toFixed(2)} (from $
                      {priceCalculation.originalPrice.toFixed(2)})
                    </p>
                  )}
                </div>
                {priceCalculation.appliedRules.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Applied Rules:</p>
                    {priceCalculation.appliedRules.map((rule: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="mr-1">
                        {rule}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-8">Loading pricing rules...</div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pricing rules yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant="outline">{getTypeLabel(rule.type)}</Badge>
                        <Badge variant={rule.isActive ? "default" : "outline"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary">Priority: {rule.priority}</Badge>
                      </div>
                      {rule.type === "time_based" && rule.startDate && rule.endDate && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {new Date(rule.startDate).toLocaleDateString()} -{" "}
                          {new Date(rule.endDate).toLocaleDateString()}
                        </div>
                      )}
                      {rule.type === "demand_based" && rule.demandThreshold && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <TrendingUp className="h-4 w-4 inline mr-1" />
                          Triggers at {rule.demandThreshold}% sold
                          {rule.priceMultiplier && (
                            <span className="ml-2">
                              ({((rule.priceMultiplier - 1) * 100).toFixed(0)}% increase)
                            </span>
                          )}
                        </div>
                      )}
                      {rule.type === "group_discount" && rule.minGroupSize && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <Users className="h-4 w-4 inline mr-1" />
                          Min {rule.minGroupSize} people
                          {rule.discountValue && rule.discountType && (
                            <span className="ml-2">
                              ({rule.discountType === "PERCENTAGE"
                                ? `${rule.discountValue}%`
                                : `$${rule.discountValue}`}{" "}
                              off)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!confirmDeleteRule} onOpenChange={() => setConfirmDeleteRule(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this pricing rule?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. The pricing rule will be permanently deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { handleDeleteRule(confirmDeleteRule!); setConfirmDeleteRule(null); }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

const CreateRuleForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CreateRulePayload) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "time_based" as "time_based" | "demand_based" | "group_discount" | "loyalty",
    startDate: "",
    endDate: "",
    demandThreshold: "",
    priceMultiplier: "",
    minGroupSize: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: "",
    priority: "0",
    applicableTicketTypes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateRulePayload = {
      name: formData.name,
      type: formData.type,
      priority: parseInt(formData.priority),
    };

    if (formData.type === "time_based") {
      data.startDate = new Date(formData.startDate).toISOString();
      data.endDate = new Date(formData.endDate).toISOString();
      data.discountType = formData.discountType;
      data.discountValue = parseFloat(formData.discountValue);
    } else if (formData.type === "demand_based") {
      data.demandThreshold = parseInt(formData.demandThreshold);
      data.priceMultiplier = parseFloat(formData.priceMultiplier);
    } else if (formData.type === "group_discount") {
      data.minGroupSize = parseInt(formData.minGroupSize);
      data.discountType = formData.discountType;
      data.discountValue = parseFloat(formData.discountValue);
    }

    if (formData.applicableTicketTypes) {
      data.applicableTicketTypes = formData.applicableTicketTypes
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Rule Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Early Bird Discount"
        />
      </div>
      <div>
        <Label htmlFor="type">Rule Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: PricingRule["type"]) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time_based">Time-Based</SelectItem>
            <SelectItem value="demand_based">Demand-Based</SelectItem>
            <SelectItem value="group_discount">Group Discount</SelectItem>
            <SelectItem value="loyalty">Loyalty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.type === "time_based" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountType">Discount Type</Label>
              <Select
                value={formData.discountType}
            onValueChange={(value: "PERCENTAGE" | "FIXED_AMOUNT") =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountValue">Discount Value *</Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                required
              />
            </div>
          </div>
        </>
      )}

      {formData.type === "demand_based" && (
        <>
          <div>
            <Label htmlFor="demandThreshold">Demand Threshold (%) *</Label>
            <Input
              id="demandThreshold"
              type="number"
              min="0"
              max="100"
              value={formData.demandThreshold}
              onChange={(e) => setFormData({ ...formData, demandThreshold: e.target.value })}
              required
              placeholder="e.g., 80"
            />
          </div>
          <div>
            <Label htmlFor="priceMultiplier">Price Multiplier *</Label>
            <Input
              id="priceMultiplier"
              type="number"
              step="0.01"
              min="0.1"
              max="10"
              value={formData.priceMultiplier}
              onChange={(e) => setFormData({ ...formData, priceMultiplier: e.target.value })}
              required
              placeholder="e.g., 1.2 for 20% increase"
            />
          </div>
        </>
      )}

      {formData.type === "group_discount" && (
        <>
          <div>
            <Label htmlFor="minGroupSize">Min Group Size *</Label>
            <Input
              id="minGroupSize"
              type="number"
              min="2"
              value={formData.minGroupSize}
              onChange={(e) => setFormData({ ...formData, minGroupSize: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountType">Discount Type</Label>
              <Select
                value={formData.discountType}
            onValueChange={(value: "PERCENTAGE" | "FIXED_AMOUNT") =>
                  setFormData({ ...formData, discountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountValue">Discount Value *</Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                required
              />
            </div>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Input
          id="priority"
          type="number"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          placeholder="Higher priority rules apply first"
        />
      </div>

      <div>
        <Label htmlFor="applicableTicketTypes">Applicable Ticket Types (comma-separated, leave empty for all)</Label>
        <Input
          id="applicableTicketTypes"
          value={formData.applicableTicketTypes}
          onChange={(e) => setFormData({ ...formData, applicableTicketTypes: e.target.value })}
          placeholder="e.g., VIP, General"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Rule</Button>
      </div>
    </form>
  );
};

const PriceCalculatorForm = ({
  onSubmit,
}: {
  onSubmit: (ticketType: string, quantity: number) => void;
}) => {
  const [ticketType, setTicketType] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(ticketType, parseInt(quantity));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="ticketType">Ticket Type *</Label>
        <Input
          id="ticketType"
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value)}
          required
          placeholder="e.g., General Admission"
        />
      </div>
      <div>
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Calculate</Button>
      </div>
    </form>
  );
};

export default DynamicPricing;

