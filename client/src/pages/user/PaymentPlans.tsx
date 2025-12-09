import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Plus,
} from "lucide-react";
import {
  getUserPaymentPlans,
  getPaymentPlanByRegistration,
  processInstallmentPayment,
  getOverdueInstallments,
  cancelPaymentPlan,
  createPaymentPlan,
} from "@/lib/payment-plan-api";
import { useToast } from "@/hooks/use-toast";

interface PaymentPlan {
  id: string;
  planName: string;
  totalAmount: number;
  currency: string;
  installmentCount: number;
  installmentAmount: number;
  frequency: string;
  status: string;
  startDate: string;
  endDate: string;
  installments: PaymentInstallment[];
  event?: {
    id: string;
    title: string;
  };
}

interface PaymentInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount?: number;
  status: string;
}

const PaymentPlans = () => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [overdue, setOverdue] = useState<PaymentInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plans");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "plans") {
        const response = await getUserPaymentPlans();
        if (response.success && response.data) {
          setPlans(response.data.plans || []);
        }
      } else if (activeTab === "overdue") {
        const response = await getOverdueInstallments();
        if (response.success && response.data) {
          setOverdue(response.data.installments || []);
        }
      }
    } catch (error) {
      console.error("Error loading payment plans:", error);
      toast({
        title: "Error",
        description: "Failed to load payment plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (installmentId: string, amount: number) => {
    try {
      const response = await processInstallmentPayment(installmentId, {
        amount,
        gateway: "PAYSTACK",
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Installment payment processed successfully",
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const handleCancelPlan = async (planId: string) => {
    if (!confirm("Are you sure you want to cancel this payment plan?")) return;

    try {
      const response = await cancelPaymentPlan(planId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Payment plan cancelled",
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel payment plan",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ACTIVE: { variant: "default" as const, label: "Active", icon: Clock },
      COMPLETED: { variant: "default" as const, label: "Completed", icon: CheckCircle },
      CANCELLED: { variant: "outline" as const, label: "Cancelled", icon: X },
      DEFAULTED: { variant: "destructive" as const, label: "Defaulted", icon: AlertCircle },
      PENDING: { variant: "outline" as const, label: "Pending", icon: Clock },
      PAID: { variant: "default" as const, label: "Paid", icon: CheckCircle },
      OVERDUE: { variant: "destructive" as const, label: "Overdue", icon: AlertCircle },
    };
    const config = variants[status] || { variant: "outline" as const, label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your installment payment plans
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Payment Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Payment Plan</DialogTitle>
            </DialogHeader>
            <CreatePaymentPlanForm
              onSubmit={async (data) => {
                try {
                  await createPaymentPlan(data);
                  toast({
                    title: "Success",
                    description: "Payment plan created successfully",
                  });
                  setIsCreateDialogOpen(false);
                  loadData();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to create payment plan",
                    variant: "destructive",
                  });
                }
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">My Plans</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading payment plans...</div>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payment plans yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{plan.planName}</CardTitle>
                        {plan.event && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.event.title}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(plan.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-semibold">
                            {formatCurrency(plan.totalAmount, plan.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Installments</p>
                          <p className="font-semibold">
                            {plan.installmentCount} payments
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Per Installment</p>
                          <p className="font-semibold">
                            {formatCurrency(plan.installmentAmount, plan.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p className="font-semibold">{plan.frequency}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Installment Schedule</p>
                        <div className="space-y-2">
                          {plan.installments.map((installment) => (
                            <div
                              key={installment.id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  Installment #{installment.installmentNumber}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  Due: {new Date(installment.dueDate).toLocaleDateString()}
                                </span>
                                {getStatusBadge(installment.status)}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">
                                  {formatCurrency(installment.amount, plan.currency)}
                                </span>
                                {installment.status === "PENDING" || installment.status === "OVERDUE" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessPayment(installment.id, installment.amount)}
                                  >
                                    Pay Now
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {plan.status === "ACTIVE" && (
                        <div className="flex justify-end pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelPlan(plan.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel Plan
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading overdue installments...</div>
          ) : overdue.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No overdue installments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {overdue.map((installment: any) => (
                <Card key={installment.id} className="border-destructive">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {installment.plan.registration.attendee.firstName}{" "}
                            {installment.plan.registration.attendee.lastName}
                          </h3>
                          {getStatusBadge(installment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {installment.plan.event.title} - Installment #{installment.installmentNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(installment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(installment.amount, installment.currency)}
                        </p>
                        <Button
                          className="mt-2"
                          onClick={() => handleProcessPayment(installment.id, installment.amount)}
                        >
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CreatePaymentPlanForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    registrationId: "",
    planName: "",
    installmentCount: "3",
    frequency: "MONTHLY" as "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "CUSTOM",
    startDate: "",
    autoPaymentEnabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      installmentCount: parseInt(formData.installmentCount),
      startDate: formData.startDate || new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="registrationId">Registration ID *</Label>
        <Input
          id="registrationId"
          value={formData.registrationId}
          onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
          required
          placeholder="Enter registration ID"
        />
      </div>
      <div>
        <Label htmlFor="planName">Plan Name *</Label>
        <Input
          id="planName"
          value={formData.planName}
          onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
          required
          placeholder="e.g., Monthly Payment Plan"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="installmentCount">Number of Installments *</Label>
          <Input
            id="installmentCount"
            type="number"
            min="2"
            max="24"
            value={formData.installmentCount}
            onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="frequency">Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="startDate">Start Date *</Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Plan</Button>
      </div>
    </form>
  );
};

export default PaymentPlans;
