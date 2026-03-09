import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingDown, Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, X, AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getExpenses, deleteExpense, type PlatformExpense } from "@/lib/accounting-api";
import { useToast } from "@/hooks/useToast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showErrorToast } from "@/lib/utils/error";

const ExpensesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<PlatformExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PlatformExpense | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getExpenses({ limit: 200 });
        if (response.success && response.data) {
          const expenseList = response.data.expenses || response.data.items || [];
          setExpenses(expenseList);
        } else {
          setError(response.message || 'Failed to fetch expenses');
        }
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to load expense records');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));
  }, [expenses]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (expense.recipient && expense.recipient.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || expense.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  // Calculate totals
  const totalExpenses = useMemo(() => {
    return expenses
      .filter(e => e.status.toLowerCase() !== 'cancelled')
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const pendingExpenses = useMemo(() => {
    return expenses
      .filter(e => e.status.toLowerCase() === 'pending')
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    const variants: Record<string, string> = {
      completed: "bg-success/10 text-success border-success/20",
      pending: "bg-warning/10 text-warning border-warning/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return variants[normalizedStatus] || "bg-muted text-muted-foreground border-border";
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return "bg-muted text-muted-foreground border-border";
    const normalizedMethod = method.toLowerCase();
    const variants: Record<string, string> = {
      cash: "bg-muted text-muted-foreground border-border",
      bank_transfer: "bg-primary/10 text-primary border-primary/20",
      credit_card: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      check: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      mpesa: "bg-success/10 text-success border-success/20",
      mobile_money: "bg-teal-500/10 text-teal-600 border-teal-500/20"
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

  const handleAddExpense = () => {
    navigate('/admin/finance/expenses/new');
  };

  const handleViewExpense = (expense: PlatformExpense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  const handleEditExpense = (id: string) => {
    navigate(`/admin/finance/expenses/edit/${id}`);
  };

  const handleDeleteExpense = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm;
    setDeleteConfirm(null);
    try {
      setDeleting(id);
      const response = await deleteExpense(id);
      if (response.success) {
        setExpenses(expenses.filter(e => e.id !== id));
        toast({
          title: "Expense Deleted",
          description: "The expense has been deleted successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to delete expense');
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      showErrorToast(toast, err, "Failed to delete expense. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading expenses...</span>
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
            <h1 className="text-base font-semibold text-foreground">Expense Management</h1>
            <p className="text-muted-foreground">Track and manage all company expenses</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/finance')}>
              <DollarSign className="h-4 w-4 mr-2" />
              Finance Dashboard
            </Button>
            <Button size="sm" onClick={handleAddExpense}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Expense Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="font-semibold text-warning mb-2">
                {formatCurrency(pendingExpenses)}
              </div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-foreground mb-2">
                {expenses.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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
          </CardContent>
        </Card>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No expenses found</h3>
                <p>Try adjusting your search or filter criteria, or add a new expense</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground truncate">{expense.description}</h3>
                        <Badge className={`text-xs ${getStatusBadge(expense.status)}`}>
                          {expense.status}
                        </Badge>
                        {expense.paymentMethod && (
                          <Badge className={`text-xs ${getPaymentMethodBadge(expense.paymentMethod)}`}>
                            {formatPaymentMethod(expense.paymentMethod)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{expense.category}</span>
                        </div>
                        {expense.recipient && (
                          <div className="flex items-center gap-1">
                            <span>To: {expense.recipient}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(expense.expenseDate)}</span>
                        </div>
                        {expense.reference && (
                          <div className="flex items-center gap-1">
                            <span>Ref: {expense.reference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          -{formatCurrency(Number(expense.amount))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewExpense(expense)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditExpense(expense.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={deleting === expense.id}
                        >
                          {deleting === expense.id ? (
                            <Loader size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Expense Modal */}
        {showViewModal && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Expense Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p className="text-sm text-foreground">{selectedExpense.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="text-sm text-foreground">{selectedExpense.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className="text-sm font-semibold text-destructive">-{formatCurrency(Number(selectedExpense.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedExpense.status)}`}>
                      {selectedExpense.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                    <p className="text-sm text-foreground">{formatPaymentMethod(selectedExpense.paymentMethod)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-sm text-foreground">{formatDate(selectedExpense.expenseDate)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm text-foreground">{selectedExpense.description}</p>
                </div>

                {selectedExpense.recipient && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Recipient</label>
                    <p className="text-sm text-foreground">{selectedExpense.recipient}</p>
                  </div>
                )}

                {selectedExpense.reference && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reference</label>
                    <p className="text-sm text-foreground">{selectedExpense.reference}</p>
                  </div>
                )}

                {selectedExpense.receiptUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Receipt</label>
                    <p className="text-sm text-foreground">{selectedExpense.receiptUrl}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewModal(false);
                  handleEditExpense(selectedExpense.id);
                }}>
                  Edit Expense
                </Button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteExpense} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default ExpensesPage;
