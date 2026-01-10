import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, Eye, Search, AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminLayout from "../AdminLayout";
import { getCombinedTransactions, type AccountingTransaction, type FinancialOverview } from "@/lib/accounting-api";

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
  const [summary, setSummary] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getCombinedTransactions({ limit: 100 });
        if (response.success && response.data) {
          setTransactions(response.data.transactions);
          setSummary(response.data.summary);
        } else {
          setError(response.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique categories from transactions
  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (transaction.source && transaction.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  // Calculate pending amount
  const pendingAmount = useMemo(() => {
    return transactions
      .filter(t => t.status.toLowerCase() === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const pendingCount = useMemo(() => {
    return transactions.filter(t => t.status.toLowerCase() === 'pending').length;
  }, [transactions]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    const variants: Record<string, string> = {
      completed: "bg-success/10 text-success border-success/20",
      received: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return variants[normalizedStatus] || "bg-muted text-muted-foreground border-border";
  };

  const getTypeBadge = (type: string) => {
    return type === "income"
      ? "bg-success/10 text-success border-success/20"
      : "bg-destructive/10 text-destructive border-destructive/20";
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return "bg-muted text-muted-foreground border-border";
    const normalizedMethod = method.toLowerCase();
    const variants: Record<string, string> = {
      cash: "bg-muted text-muted-foreground border-border",
      bank_transfer: "bg-primary/10 text-primary border-primary/20",
      credit_card: "bg-muted text-muted-foreground border-border",
      check: "bg-warning/10 text-warning border-warning",
      mobile_money: "bg-teal-500/10 text-teal-600 border-teal-500/20",
      mpesa: "bg-success/10 text-success border-success/20"
    };
    return variants[normalizedMethod] || "bg-muted text-muted-foreground border-border";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return 'N/A';
    return method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading financial data...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const netProfit = summary?.netProfit || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Finance Dashboard</h1>
            <p className="text-muted-foreground">Track income, expenses, and financial performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/finance/expenses/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/finance/income-statement')}>
              <Eye className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <span className="text-success text-sm font-medium">{summary?.incomeCount || 0} entries</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Income</h3>
                <p className="font-semibold text-success">{formatCurrency(totalIncome)}</p>
                <p className="text-sm text-muted-foreground">All time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
                <span className="text-destructive text-sm font-medium">{summary?.expenseCount || 0} entries</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Expenses</h3>
                <p className="font-semibold text-destructive">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-muted-foreground">All time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {netProfit >= 0 ? 'Profit' : 'Loss'}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Net Profit</h3>
                <p className={`font-semibold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-sm text-muted-foreground">All time</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-muted">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground text-sm font-medium">{pendingCount}</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Pending Payments</h3>
                <p className="font-semibold text-muted-foreground">
                  {formatCurrency(pendingAmount)}
                </p>
                <p className="text-sm text-muted-foreground">Awaiting processing</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-base font-medium mb-2">No transactions found</h3>
                  <p>Add income or expense entries to see them here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${transaction.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                            {transaction.type === "income" ? (
                              <TrendingUp className="h-5 w-5 text-success" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{transaction.description}</h3>
                          <Badge className={`text-xs ${getTypeBadge(transaction.type)}`}>
                            {transaction.type}
                          </Badge>
                          <Badge className={`text-xs ${getStatusBadge(transaction.status)}`}>
                            {transaction.status}
                          </Badge>
                          {transaction.paymentMethod && (
                            <Badge className={`text-xs ${getPaymentMethodBadge(transaction.paymentMethod)}`}>
                              {formatPaymentMethod(transaction.paymentMethod)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="font-medium">{transaction.category}</span>
                          {transaction.source && (
                            <span>From: {transaction.source}</span>
                          )}
                          {transaction.recipient && (
                            <span>To: {transaction.recipient}</span>
                          )}
                          <span>Date: {formatDate(transaction.date)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-destructive"}`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinanceDashboard;
