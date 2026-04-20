import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Search, Eye, Calendar, TrendingUp, TrendingDown, DollarSign, Edit, Trash2, X, AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCombinedTransactions, deleteExpense, deleteIncome, type AccountingTransaction, type FinancialOverview } from "@/lib/accounting-api";
import { useToast } from "@/hooks/useToast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showErrorToast } from "@/lib/utils/error";

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
  const [summary, setSummary] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<AccountingTransaction | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AccountingTransaction | null>(null);

  // Fetch transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getCombinedTransactions({ limit: 200 });
        if (response.success && response.data) {
          setTransactions(response.data.transactions);
          setSummary(response.data.summary);
        } else {
          setError(response.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (transaction.source && transaction.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || transaction.status.toLowerCase() === statusFilter;

      let matchesDate = true;
      if (dateFilter === "today") {
        const today = new Date().toDateString();
        matchesDate = new Date(transaction.date).toDateString() === today;
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = new Date(transaction.date) >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = new Date(transaction.date) >= monthAgo;
      }

      return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter, statusFilter, dateFilter]);

  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const netProfit = summary?.netProfit || 0;

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

  const handleViewTransaction = (transaction: AccountingTransaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const handleEditTransaction = (transaction: AccountingTransaction) => {
    if (transaction.type === 'expense') {
      navigate(`/admin/finance/expenses/edit/${transaction.id}`);
    } else {
      navigate(`/admin/finance/income/edit/${transaction.id}`);
    }
  };

  const handleDeleteTransaction = (transaction: AccountingTransaction) => {
    setDeleteConfirm(transaction);
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteConfirm) return;
    const transaction = deleteConfirm;
    setDeleteConfirm(null);
    try {
      setDeleting(transaction.id);
      const response = transaction.type === 'expense'
        ? await deleteExpense(transaction.id)
        : await deleteIncome(transaction.id);

      if (response.success) {
        setTransactions(transactions.filter(t => t.id !== transaction.id));
        toast({
          title: "Transaction Deleted",
          description: "The transaction has been deleted successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      showErrorToast(toast, err, "Failed to delete transaction. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading transactions...</span>
        </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Transaction Overview</h1>
            <p className="text-muted-foreground">View all financial transactions and their details</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/finance/income-statement')}>
              <DollarSign className="h-4 w-4 mr-2" />
              Financial Summary
            </Button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-success mb-2">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-sm text-muted-foreground">Total Income</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-destructive mb-2">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className={`font-semibold mb-2 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                <p>Try adjusting your search or filter criteria</p>
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
                        <h3 className="text-lg font-semibold text-foreground truncate">{transaction.description}</h3>
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
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{transaction.category}</span>
                        </div>
                        {transaction.source && (
                          <div className="flex items-center gap-1">
                            <span>From: {transaction.source}</span>
                          </div>
                        )}
                        {transaction.recipient && (
                          <div className="flex items-center gap-1">
                            <span>To: {transaction.recipient}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                        {transaction.reference && (
                          <div className="flex items-center gap-1">
                            <span>Ref: {transaction.reference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-destructive"}`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewTransaction(transaction)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditTransaction(transaction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction)}
                        disabled={deleting === transaction.id}
                      >
                        {deleting === transaction.id ? (
                          <Loader size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Transaction Modal */}
        {showViewModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Transaction Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                    <p className="text-sm text-foreground">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reference</label>
                    <p className="text-sm text-foreground">{selectedTransaction.reference || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-sm text-foreground capitalize">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="text-sm text-foreground">{selectedTransaction.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className={`text-sm font-semibold ${selectedTransaction.type === "income" ? "text-success" : "text-destructive"}`}>
                      {selectedTransaction.type === "income" ? "+" : "-"}{formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                    <p className="text-sm text-foreground">{formatPaymentMethod(selectedTransaction.paymentMethod)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-sm text-foreground">{formatDate(selectedTransaction.date)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm text-foreground">{selectedTransaction.description}</p>
                </div>

                {selectedTransaction.source && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Source</label>
                    <p className="text-sm text-foreground">{selectedTransaction.source}</p>
                  </div>
                )}

                {selectedTransaction.recipient && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Recipient</label>
                    <p className="text-sm text-foreground">{selectedTransaction.recipient}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewModal(false);
                  handleEditTransaction(selectedTransaction);
                }}>
                  Edit Transaction
                </Button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default TransactionsPage;
