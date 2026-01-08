import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Eye, Edit, Trash2, Calendar, User, DollarSign, X, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminLayout from "../AdminLayout";
import { getExpenses, deleteExpense, type PlatformExpense } from "@/lib/accounting-api";
import { useToast } from "@/hooks/useToast";

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
      completed: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[normalizedStatus] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return "bg-gray-100 text-gray-800 border-gray-200";
    const normalizedMethod = method.toLowerCase();
    const variants: Record<string, string> = {
      bank_transfer: "bg-blue-100 text-blue-800 border-blue-200",
      check: "bg-orange-100 text-orange-800 border-orange-200",
      cash: "bg-gray-100 text-gray-800 border-gray-200",
      mpesa: "bg-green-100 text-green-800 border-green-200",
      mobile_money: "bg-teal-100 text-teal-800 border-teal-200"
    };
    return variants[normalizedMethod] || "bg-gray-100 text-gray-800 border-gray-200";
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

  const handleDeleteWage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this wage record? This action cannot be undone.")) {
      return;
    }

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
      toast({
        title: "Error",
        description: "Failed to delete wage record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading wage records...</span>
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Wage Management</h1>
            <p className="text-gray-600">Track and manage employee wages and payroll</p>
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
              <div className="font-semibold text-red-600 mb-2">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-sm text-gray-600">Total Wages Paid</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-yellow-600 mb-2">
                {formatCurrency(pendingAmount)}
              </div>
              <p className="text-sm text-gray-600">Pending Payments</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-gray-600 mb-2">
                {wages.length}
              </div>
              <p className="text-sm text-gray-600">Total Records</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              <div className="text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                        <div className="p-2 rounded-lg bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
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
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
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
                        <p className="font-semibold text-red-600">
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
                            <Loader2 className="h-4 w-4 animate-spin" />
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
                    <label className="text-sm font-medium text-gray-600">ID</label>
                    <p className="text-sm text-foreground">{selectedWage.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reference</label>
                    <p className="text-sm text-foreground">{selectedWage.reference || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Recipient</label>
                    <p className="text-sm text-foreground">{selectedWage.recipient || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-sm font-semibold text-red-600">-{formatCurrency(Number(selectedWage.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedWage.status)}`}>
                      {selectedWage.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm text-foreground">{formatPaymentMethod(selectedWage.paymentMethod)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-sm text-foreground">{formatDate(selectedWage.expenseDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Currency</label>
                    <p className="text-sm text-foreground">{selectedWage.currency}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
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
      </div>
    </AdminLayout>
  );
};

export default WagesPage;
