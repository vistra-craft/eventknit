import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Eye, Edit, Trash2, Calendar, User, DollarSign, X, AlertCircle } from "lucide-react";
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

const WagesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wages, setWages] = useState<PlatformExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedWage, setSelectedWage] = useState<PlatformExpense | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch wages (expenses with category "Wages")
  useEffect(() => {
    const fetchWages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getExpenses({ category: 'Wages', limit: 200 });
        if (response.success && response.data) {
          const wageEntries = response.data.expenses || response.data.items || [];
          setWages(wageEntries);
        } else {
          setError(response.message || 'Failed to fetch wages');
        }
      } catch (err) {
        console.error('Error fetching wages:', err);
        setError('Failed to load wage records');
      } finally {
        setLoading(false);
      }
    };

    fetchWages();
  }, []);

  // Filter wages
  const filteredWages = useMemo(() => {
    return wages.filter(wage => {
      const matchesSearch = wage.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (wage.recipient && wage.recipient.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || wage.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [wages, searchTerm, statusFilter]);

  // Calculate totals
  const totalPaid = useMemo(() => {
    return wages
      .filter(w => w.status.toLowerCase() === 'completed')
      .reduce((sum, w) => sum + Number(w.amount), 0);
  }, [wages]);

  const pendingAmount = useMemo(() => {
    return wages
      .filter(w => w.status.toLowerCase() === 'pending')
      .reduce((sum, w) => sum + Number(w.amount), 0);
  }, [wages]);

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
      bank_transfer: "bg-primary/10 text-primary border-primary/20",
      check: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      cash: "bg-muted text-muted-foreground border-border",
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

  const handleAddWage = () => {
    navigate('/admin/finance/wages/new');
  };

  const handleViewWage = (wage: PlatformExpense) => {
    setSelectedWage(wage);
    setShowViewModal(true);
  };

  const handleEditWage = (id: string) => {
    navigate(`/admin/finance/wages/edit/${id}`);
  };

  const handleDeleteWage = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDeleteWage = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm;
    setDeleteConfirm(null);
    try {
      setDeleting(id);
      const response = await deleteExpense(id);
      if (response.success) {
        setWages(wages.filter(w => w.id !== id));
        toast({
          title: "Wage Deleted",
          description: "The wage record has been deleted successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to delete wage');
      }
    } catch (err) {
      console.error('Error deleting wage:', err);
      showErrorToast(toast, err, "Failed to delete wage record. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
          <span className="ml-2 text-muted-foreground">Loading wage records...</span>
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
            <h1 className="text-lg font-semibold text-foreground">Wage Management</h1>
            <p className="text-muted-foreground">Track and manage employee wages and payroll</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/finance')}>
              <DollarSign className="h-4 w-4 mr-2" />
              Finance Dashboard
            </Button>
            <Button size="sm" onClick={handleAddWage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Wage
            </Button>
          </div>
        </div>

        {/* Wage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-destructive mb-2">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-sm text-muted-foreground">Total Wages Paid</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-warning mb-2">
                {formatCurrency(pendingAmount)}
              </div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-foreground mb-2">
                {wages.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by description or recipient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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

        {/* Wages List */}
        {filteredWages.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No wage records found</h3>
                <p>Try adjusting your search or filter criteria, or add a new wage entry</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredWages.map((wage) => (
              <Card key={wage.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{wage.recipient || 'Employee'}</h3>
                        <Badge className={`text-xs ${getStatusBadge(wage.status)}`}>
                          {wage.status}
                        </Badge>
                        {wage.paymentMethod && (
                          <Badge className={`text-xs ${getPaymentMethodBadge(wage.paymentMethod)}`}>
                            {formatPaymentMethod(wage.paymentMethod)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <span>{wage.description}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(wage.expenseDate)}</span>
                        </div>
                        {wage.reference && (
                          <div className="flex items-center gap-1">
                            <span>Ref: {wage.reference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          -{formatCurrency(Number(wage.amount))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewWage(wage)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditWage(wage.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWage(wage.id)}
                          disabled={deleting === wage.id}
                        >
                          {deleting === wage.id ? (
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

        {/* View Wage Modal */}
        {showViewModal && selectedWage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Wage Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p className="text-sm text-foreground">{selectedWage.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reference</label>
                    <p className="text-sm text-foreground">{selectedWage.reference || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Recipient</label>
                    <p className="text-sm text-foreground">{selectedWage.recipient || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className="text-sm font-semibold text-destructive">-{formatCurrency(Number(selectedWage.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedWage.status)}`}>
                      {selectedWage.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                    <p className="text-sm text-foreground">{formatPaymentMethod(selectedWage.paymentMethod)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-sm text-foreground">{formatDate(selectedWage.expenseDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Currency</label>
                    <p className="text-sm text-foreground">{selectedWage.currency}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm text-foreground">{selectedWage.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewModal(false);
                  handleEditWage(selectedWage.id);
                }}>
                  Edit Wage
                </Button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Wage Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this wage record? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteWage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
};

export default WagesPage;
