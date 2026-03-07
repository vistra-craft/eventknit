import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Receipt,
  FileText,
  PieChart,
} from "lucide-react";
import {
  createExpense,
  getExpenses,
  getProfitLossStatement,
  createFinancialGoal,
  getFinancialGoals,
  getTaxSummary,
  type Expense,
  type FinancialGoal,
  type FinancialPeriod,
  type FinancialTotals,
  type ProfitLossExpenses,
  type ProfitLossSummary,
  type TaxableRevenue,
  type TaxableExpenses,
  type TaxSummaryInfo,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/lib/utils/error";

interface ProfitLossStatement {
  period: FinancialPeriod;
  revenue: FinancialTotals;
  expenses: ProfitLossExpenses;
  profit: number;
  summary: ProfitLossSummary;
}

interface TaxSummary {
  year: number;
  revenue: TaxableRevenue;
  expenses: TaxableExpenses;
  taxableIncome: number;
  summary: TaxSummaryInfo;
}

type ExpensePayload = {
  eventId?: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  receiptUrl?: string;
  receiptDate?: string;
  taxAmount?: number;
  taxRate?: number;
  isTaxDeductible?: boolean;
  expenseDate?: string;
};

type GoalPayload = {
  name: string;
  description?: string;
  targetAmount: number;
  currency?: string;
  eventId?: string;
  startDate: string;
  endDate: string;
};

const FinancialManagement = () => {
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossStatement | null>(null);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === "expenses") {
        const response = await getExpenses();
        if (response.success && response.data) {
          setExpenses(response.data.expenses || []);
        }
      } else if (activeTab === "goals") {
        const response = await getFinancialGoals();
        if (response.success && response.data) {
          setGoals(response.data.goals || []);
        }
      } else if (activeTab === "profit-loss") {
        const response = await getProfitLossStatement();
        if (response.success && response.data) {
          setProfitLoss(response.data);
        }
      } else if (activeTab === "tax") {
        const response = await getTaxSummary();
        if (response.success && response.data) {
          setTaxSummary(response.data);
        }
      }
    } catch (error) {
      toast({
        title: "Failed to load financial data",
        description: extractErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    loadData();
  }, [activeTab, loadData]);

  const handleCreateExpense = async (data: ExpensePayload) => {
    try {
      const response = await createExpense(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
        setIsExpenseDialogOpen(false);
        loadData();
      }
    } catch (error) {
      toast({
        title: "Failed to create expense",
        description: extractErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleCreateGoal = async (data: GoalPayload) => {
    try {
      const response = await createFinancialGoal(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Financial goal created successfully",
        });
        setIsGoalDialogOpen(false);
        loadData();
      }
    } catch (error) {
      toast({
        title: "Failed to create financial goal",
        description: extractErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Management</h1>
            <p className="text-muted-foreground mt-1">
              Track expenses, set goals, and analyze financial performance
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="goals">Financial Goals</TabsTrigger>
            <TabsTrigger value="tax">Tax Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                  </DialogHeader>
                  <ExpenseForm
                    onSubmit={handleCreateExpense}
                    onCancel={() => setIsExpenseDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No expenses recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{expense.category}</h3>
                            <Badge variant="outline">{expense.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {expense.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(expense.amount, expense.currency)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profit-loss" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading profit & loss statement...</div>
            ) : profitLoss ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Revenue</span>
                      <span className="font-semibold">
                        {formatCurrency(profitLoss.revenue.gross)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fees</span>
                      <span className="text-destructive">
                        -{formatCurrency(profitLoss.revenue.platformFees ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Net Revenue</span>
                      <span className="font-bold text-success">
                        {formatCurrency(profitLoss.revenue.net)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expenses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Expenses</span>
                      <span className="font-semibold text-destructive">
                        -{formatCurrency(profitLoss.expenses.total)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Revenue</span>
                      <span className="font-semibold">
                        {formatCurrency(profitLoss.revenue.gross)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Profit / Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground">Net Profit</p>
                        <p
                          className={`text-3xl font-bold ${
                            profitLoss.profit >= 0
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {formatCurrency(profitLoss.profit)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Margin: {profitLoss.summary.profitMargin.toFixed(2)}%
                        </p>
                      </div>
                      {profitLoss.profit >= 0 ? (
                        <TrendingUp className="h-12 w-12 text-success" />
                      ) : (
                        <TrendingDown className="h-12 w-12 text-destructive" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No financial data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Financial Goal</DialogTitle>
                  </DialogHeader>
                  <GoalForm
                    onSubmit={handleCreateGoal}
                    onCancel={() => setIsGoalDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading goals...</div>
            ) : goals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No financial goals set yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={goal.status === "completed" ? "default" : "outline"}>
                          {goal.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">
                              {formatCurrency(goal.currentAmount)} /{" "}
                              {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(goal.progressPercentage ?? 0, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(goal.progressPercentage ?? 0).toFixed(1)}% complete
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>
                            Start: {new Date(goal.startDate).toLocaleDateString()}
                          </p>
                          <p>
                            End: {new Date(goal.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading tax summary...</div>
            ) : taxSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Year {taxSummary.year}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Revenue</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross</span>
                          <span>{formatCurrency(taxSummary.revenue.gross)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fees</span>
                          <span>-{formatCurrency(taxSummary.revenue.platformFees ?? 0)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-semibold">
                          <span>Net Revenue</span>
                          <span>{formatCurrency(taxSummary.revenue.net)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Deductible Expenses</h3>
                      <p className="text-2xl font-bold">
                        {formatCurrency(taxSummary.expenses.deductible)}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Taxable Income</h3>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(taxSummary.taxableIncome)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tax data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

const ExpenseForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: ExpensePayload) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    eventId: "",
    category: "",
    description: "",
    amount: "",
    currency: "NGN",
    receiptUrl: "",
    receiptDate: "",
    taxAmount: "",
    taxRate: "",
    isTaxDeductible: false,
    expenseDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      eventId: formData.eventId || undefined,
      amount: parseFloat(formData.amount),
      taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
      receiptUrl: formData.receiptUrl || undefined,
      receiptDate: formData.receiptDate || undefined,
      expenseDate: formData.expenseDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            placeholder="e.g., Marketing"
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expenseDate">Expense Date</Label>
          <Input
            id="expenseDate"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NGN">NGN</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isTaxDeductible"
          checked={formData.isTaxDeductible}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isTaxDeductible: !!checked })
          }
        />
        <Label htmlFor="isTaxDeductible">Tax-deductible</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Expense</Button>
      </div>
    </form>
  );
};

const GoalForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: GoalPayload) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAmount: "",
    currency: "NGN",
    eventId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      eventId: formData.eventId || undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Goal Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Q1 Revenue Target"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetAmount">Target Amount *</Label>
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NGN">NGN</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Goal</Button>
      </div>
    </form>
  );
};

export default FinancialManagement;

