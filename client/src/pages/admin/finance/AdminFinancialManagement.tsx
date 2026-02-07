import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  FileText,
  BarChart3,
} from "lucide-react";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  createIncome,
  getIncomes,
  updateIncome,
  deleteIncome,
  getMonthlySummary,
  getFinancialOverview,
  type Expense,
  type Income,
  type MonthlySummary,
  type FinancialOverview,
  type CreateExpenseData,
  type CreateIncomeData,
} from "@/lib/admin-financial-api";
import { useToast } from "@/hooks/useToast";

const AdminFinancialManagement = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === "overview") {
        const [overviewRes, expensesRes, incomesRes] = await Promise.all([
          getFinancialOverview(),
          getExpenses({ limit: 10 }),
          getIncomes({ limit: 10 }),
        ]);
        if (overviewRes.success) setOverview(overviewRes.data || null);
        if (expensesRes.success && expensesRes.data) {
          setExpenses(expensesRes.data.expenses || []);
        }
        if (incomesRes.success && incomesRes.data) {
          setIncomes(incomesRes.data.incomes || []);
        }
      } else if (activeTab === "expenses") {
        const response = await getExpenses();
        if (response.success && response.data) {
          setExpenses(response.data.expenses || []);
        }
      } else if (activeTab === "income") {
        const response = await getIncomes();
        if (response.success && response.data) {
          setIncomes(response.data.incomes || []);
        }
      }
    } catch (error) {
      console.error("Error loading financial data:", error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  const loadMonthlySummary = useCallback(async () => {
    try {
      const response = await getMonthlySummary(selectedYear, selectedMonth);
      if (response.success && response.data) {
        setMonthlySummary(response.data);
      }
    } catch (error) {
      console.error("Error loading monthly summary:", error);
      toast({
        title: "Error",
        description: "Failed to load monthly summary",
        variant: "destructive",
      });
    }
  }, [selectedMonth, selectedYear, toast]);

  useEffect(() => {
    loadData();
  }, [activeTab, loadData]);

  useEffect(() => {
    if (activeTab === "summary") {
      loadMonthlySummary();
    }
  }, [activeTab, loadMonthlySummary]);

  const allowedExpenseMethods = ["cash", "bank_transfer", "credit_card", "check"] as const;
  type ExpenseMethod = (typeof allowedExpenseMethods)[number];

  const handleCreateExpense = async (data: CreateExpenseData) => {
    try {
      const paymentMethod = allowedExpenseMethods.includes(data.paymentMethod as ExpenseMethod)
        ? (data.paymentMethod as ExpenseMethod)
        : undefined;

      const payload: Parameters<typeof createExpense>[0] = {
        category: data.category,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        paymentMethod,
        recipient: data.recipient,
        reference: data.reference,
        receiptUrl: data.receiptUrl,
        receiptDate: data.receiptDate,
        taxAmount: data.taxAmount,
        taxRate: data.taxRate,
        isTaxDeductible: data.isTaxDeductible,
        expenseDate: data.expenseDate,
      };
      const response = await createExpense(payload);
      if (response.success) {
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
        setIsExpenseDialogOpen(false);
        loadData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExpense = async (id: string, data: Partial<Expense>) => {
    try {
      const paymentMethod = allowedExpenseMethods.includes(data.paymentMethod as ExpenseMethod)
        ? (data.paymentMethod as ExpenseMethod)
        : undefined;

      const payload: Parameters<typeof updateExpense>[1] = {
        category: data.category,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        paymentMethod,
        recipient: data.recipient,
        reference: data.reference,
        receiptUrl: data.receiptUrl,
        receiptDate: data.receiptDate,
        taxAmount: data.taxAmount,
        taxRate: data.taxRate,
        isTaxDeductible: data.isTaxDeductible,
        status: data.status as Parameters<typeof updateExpense>[1]["status"],
        expenseDate: data.expenseDate,
      };
      const response = await updateExpense(id, payload);
      if (response.success) {
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
        setIsExpenseDialogOpen(false);
        setSelectedExpense(null);
        loadData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await deleteExpense(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Expense deleted successfully",
        });
        loadData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleCreateIncome = async (data: CreateIncomeData) => {
    try {
      const response = await createIncome(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Income created successfully",
        });
        setIsIncomeDialogOpen(false);
        loadData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create income",
        variant: "destructive",
      });
    }
  };

  const handleUpdateIncome = async (id: string, data: Partial<Income>) => {
    try {
      const payload: Parameters<typeof updateIncome>[1] = {
        category: data.category,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        source: data.source,
        reference: data.reference,
        paymentMethod: data.paymentMethod,
        eventId: data.eventId,
        transactionId: data.transactionId,
        taxAmount: data.taxAmount,
        taxRate: data.taxRate,
        status: data.status as Parameters<typeof updateIncome>[1]["status"],
        incomeDate: data.incomeDate,
      };
      const response = await updateIncome(id, payload);
      if (response.success) {
        toast({
          title: "Success",
          description: "Income updated successfully",
        });
        setIsIncomeDialogOpen(false);
        setSelectedIncome(null);
        loadData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update income",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income?")) return;

    try {
      const response = await deleteIncome(id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Income deleted successfully",
        });
        loadData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete income",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "PENDING",
      approved: "APPROVED",
      paid: "APPROVED",
      received: "APPROVED",
      cancelled: "DECLINED",
    };
    const mappedStatus = statusMap[status] || status;
    return <Badge className={getEventStatusBadgeClass(mappedStatus)}>{status}</Badge>;
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Financial Management</h1>
            <p className="text-muted-foreground mt-1">
              Track platform income and expenditures
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading overview...</div>
            ) : overview ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Income
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-success">
                        {formatCurrency(overview.totalIncome)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Expenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">
                        {formatCurrency(overview.totalExpenses)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Net Profit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${
                          overview.netProfit >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatCurrency(overview.netProfit)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {expenses.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No expenses yet</p>
                      ) : (
                        <div className="space-y-2">
                          {expenses.slice(0, 5).map((expense) => (
                            <div
                              key={expense.id}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <div>
                                <p className="font-semibold text-sm">{expense.category}</p>
                                <p className="text-xs text-muted-foreground">
                                  {expense.description.substring(0, 50)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-destructive">
                                  {formatCurrency(Number(expense.amount))}
                                </p>
                                {getStatusBadge(expense.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {incomes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No income yet</p>
                      ) : (
                        <div className="space-y-2">
                          {incomes.slice(0, 5).map((income) => (
                            <div
                              key={income.id}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <div>
                                <p className="font-semibold text-sm">{income.category}</p>
                                <p className="text-xs text-muted-foreground">
                                  {income.description.substring(0, 50)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-success">
                                  {formatCurrency(Number(income.amount))}
                                </p>
                                {getStatusBadge(income.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No financial data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Platform Expenses</h2>
              <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedExpense ? "Edit Expense" : "Create Expense"}
                    </DialogTitle>
                  </DialogHeader>
                  <ExpenseForm
                    expense={selectedExpense}
                    onSubmit={(data) => {
                      if (selectedExpense) {
                        handleUpdateExpense(selectedExpense.id, data);
                      } else {
                        handleCreateExpense({
                          ...data,
                          paymentMethod: data.paymentMethod as CreateExpenseData["paymentMethod"],
                        });
                      }
                    }}
                    onCancel={() => {
                      setIsExpenseDialogOpen(false);
                      setSelectedExpense(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No expenses recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{expense.category}</h3>
                            {getStatusBadge(expense.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {expense.description}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {expense.recipient && (
                              <span>Recipient: {expense.recipient}</span>
                            )}
                            {expense.reference && (
                              <span>Ref: {expense.reference}</span>
                            )}
                            <span>
                              {new Date(expense.expenseDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-destructive">
                              {formatCurrency(Number(expense.amount))}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setIsExpenseDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Platform Income</h2>
              <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedIncome ? "Edit Income" : "Create Income"}
                    </DialogTitle>
                  </DialogHeader>
                  <IncomeForm
                    income={selectedIncome}
                    onSubmit={(data) => {
                      if (selectedIncome) {
                        handleUpdateIncome(selectedIncome.id, data);
                      } else {
                        handleCreateIncome(data);
                      }
                    }}
                    onCancel={() => {
                      setIsIncomeDialogOpen(false);
                      setSelectedIncome(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading income...</div>
            ) : incomes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No income recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {incomes.map((income) => (
                  <Card key={income.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{income.category}</h3>
                            {getStatusBadge(income.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {income.description}
                          </p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {income.source && <span>Source: {income.source}</span>}
                            {income.reference && <span>Ref: {income.reference}</span>}
                            {income.event && (
                              <span>Event: {income.event.title}</span>
                            )}
                            <span>
                              {new Date(income.incomeDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-success">
                              {formatCurrency(Number(income.amount))}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIncome(income);
                                setIsIncomeDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteIncome(income.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                    (year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {monthlySummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Income
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-success">
                        {formatCurrency(monthlySummary.summary.totalIncome)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Expenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">
                        {formatCurrency(monthlySummary.summary.totalExpenses)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Net Profit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`text-2xl font-bold ${
                          monthlySummary.summary.netProfit >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {formatCurrency(monthlySummary.summary.netProfit)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Expenses by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(monthlySummary.expensesByCategory).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No expenses</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(monthlySummary.expensesByCategory).map(
                            ([category, amount]) => (
                              <div
                                key={category}
                                className="flex justify-between items-center p-2 border rounded"
                              >
                                <span className="font-medium">{category}</span>
                                <span className="text-destructive font-semibold">
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Income by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(monthlySummary.incomesByCategory).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No income</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(monthlySummary.incomesByCategory).map(
                            ([category, amount]) => (
                              <div
                                key={category}
                                className="flex justify-between items-center p-2 border rounded"
                              >
                                <span className="font-medium">{category}</span>
                                <span className="text-success font-semibold">
                                  {formatCurrency(amount)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No summary data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

// Expense Form Component
const ExpenseForm = ({
  expense,
  onSubmit,
  onCancel,
}: {
  expense?: Expense | null;
  onSubmit: (data: CreateExpenseData) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    category: expense?.category || "",
    description: expense?.description || "",
    amount: expense?.amount ? Number(expense.amount).toString() : "",
    currency: expense?.currency || "NGN",
    paymentMethod: expense?.paymentMethod || "",
    recipient: expense?.recipient || "",
    reference: expense?.reference || "",
    receiptUrl: expense?.receiptUrl || "",
    receiptDate: expense?.receiptDate
      ? new Date(expense.receiptDate).toISOString().split("T")[0]
      : "",
    taxAmount: expense?.taxAmount ? Number(expense.taxAmount).toString() : "",
    taxRate: expense?.taxRate ? Number(expense.taxRate).toString() : "",
    isTaxDeductible: expense?.isTaxDeductible || false,
    expenseDate: expense?.expenseDate
      ? new Date(expense.expenseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: expense?.status || "pending",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allowedMethods = ["cash", "bank_transfer", "credit_card", "check"] as const;
    const paymentMethod =
      typeof formData.paymentMethod === "string" && allowedMethods.includes(formData.paymentMethod as (typeof allowedMethods)[number])
        ? (formData.paymentMethod as (typeof allowedMethods)[number])
        : undefined;

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
      receiptDate: formData.receiptDate || undefined,
      expenseDate: formData.expenseDate,
      paymentMethod,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Teller Payments">Teller Payments</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Facilitation">Facilitation</SelectItem>
            <SelectItem value="Utilities">Utilities</SelectItem>
            <SelectItem value="Office Supplies">Office Supplies</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="check">Check</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipient">Recipient</Label>
          <Input
            id="recipient"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="expenseDate">Expense Date *</Label>
        <Input
          id="expenseDate"
          type="date"
          value={formData.expenseDate}
          onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
          required
        />
      </div>
      {expense && (
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{expense ? "Update" : "Create"} Expense</Button>
      </div>
    </form>
  );
};

// Income Form Component
const IncomeForm = ({
  income,
  onSubmit,
  onCancel,
}: {
  income?: Income | null;
  onSubmit: (data: CreateIncomeData) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    category: income?.category || "",
    description: income?.description || "",
    amount: income?.amount ? Number(income.amount).toString() : "",
    currency: income?.currency || "NGN",
    source: income?.source || "",
    reference: income?.reference || "",
    paymentMethod: income?.paymentMethod || "",
    eventId: income?.eventId || "",
    transactionId: income?.transactionId || "",
    taxAmount: income?.taxAmount ? Number(income.taxAmount).toString() : "",
    taxRate: income?.taxRate ? Number(income.taxRate).toString() : "",
    incomeDate: income?.incomeDate
      ? new Date(income.incomeDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: income?.status || "received",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
      incomeDate: formData.incomeDate,
      eventId: formData.eventId || undefined,
      transactionId: formData.transactionId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Platform Fees">Platform Fees</SelectItem>
            <SelectItem value="Subscriptions">Subscriptions</SelectItem>
            <SelectItem value="Event Registration Fees">Event Registration Fees</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="incomeDate">Income Date *</Label>
        <Input
          id="incomeDate"
          type="date"
          value={formData.incomeDate}
          onChange={(e) => setFormData({ ...formData, incomeDate: e.target.value })}
          required
        />
      </div>
      {income && (
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{income ? "Update" : "Create"} Income</Button>
      </div>
    </form>
  );
};

export default AdminFinancialManagement;

