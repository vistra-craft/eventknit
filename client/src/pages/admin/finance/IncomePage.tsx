import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, X, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminLayout from "../AdminLayout";
import { getIncomes, deleteIncome, type PlatformIncome } from "@/lib/accounting-api";
import { useToast } from "@/hooks/use-toast";

const IncomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<PlatformIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<PlatformIncome | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch incomes
  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getIncomes({ limit: 200 });
        if (response.success && response.data) {
          setIncomes(response.data.incomes || []);
        } else {
          setError(response.message || 'Failed to fetch incomes');
        }
      } catch (err) {
        console.error('Error fetching incomes:', err);
        setError('Failed to load income records');
      } finally {
        setLoading(false);
      }
    };

    fetchIncomes();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(incomes.map(i => i.category).filter(Boolean)));
  }, [incomes]);

  // Filter incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           income.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (income.source && income.source.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || income.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || income.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [incomes, searchTerm, categoryFilter, statusFilter]);

  // Calculate totals
  const totalIncome = useMemo(() => {
    return incomes
      .filter(i => i.status.toLowerCase() !== 'cancelled')
      .reduce((sum, i) => sum + Number(i.amount), 0);
  }, [incomes]);

  const pendingIncome = useMemo(() => {
    return incomes
      .filter(i => i.status.toLowerCase() === 'pending')
      .reduce((sum, i) => sum + Number(i.amount), 0);
  }, [incomes]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    const variants: Record<string, string> = {
      completed: "bg-green-100 text-green-800 border-green-200",
      received: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[normalizedStatus] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return "bg-gray-100 text-gray-800 border-gray-200";
    const normalizedMethod = method.toLowerCase();
    const variants: Record<string, string> = {
      cash: "bg-gray-100 text-gray-800 border-gray-200",
      bank_transfer: "bg-blue-100 text-blue-800 border-blue-200",
      credit_card: "bg-purple-100 text-purple-800 border-purple-200",
      check: "bg-orange-100 text-orange-800 border-orange-200",
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

  const handleAddIncome = () => {
    navigate('/admin/finance/income/new');
  };

  const handleViewIncome = (income: PlatformIncome) => {
    setSelectedIncome(income);
    setShowViewModal(true);
  };

  const handleEditIncome = (id: string) => {
    navigate(`/admin/finance/income/edit/${id}`);
  };

  const handleDeleteIncome = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this income record? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(id);
      const response = await deleteIncome(id);
      if (response.success) {
        setIncomes(incomes.filter(i => i.id !== id));
        toast({
          title: "Income Deleted",
          description: "The income record has been deleted successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to delete income');
      }
    } catch (err) {
      console.error('Error deleting income:', err);
      toast({
        title: "Error",
        description: "Failed to delete income record. Please try again.",
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
          <span className="ml-2 text-muted-foreground">Loading income records...</span>
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
            <h1 className="text-base font-semibold text-foreground">Income Tracking</h1>
            <p className="text-gray-600">Track and manage all company income sources</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/finance')}>
              <DollarSign className="h-4 w-4 mr-2" />
              Finance Dashboard
            </Button>
            <Button size="sm" onClick={handleAddIncome}>
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </div>
        </div>

        {/* Income Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-green-600 mb-2">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-sm text-gray-600">Total Income</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-yellow-600 mb-2">
                {formatCurrency(pendingIncome)}
              </div>
              <p className="text-sm text-gray-600">Pending Payments</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-gray-600 mb-2">
                {incomes.length}
              </div>
              <p className="text-sm text-gray-600">Total Records</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search income..."
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

        {/* Income List */}
        {filteredIncomes.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No income records found</h3>
                <p>Try adjusting your search or filter criteria, or add a new income entry</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredIncomes.map((income) => (
              <Card key={income.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-100">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground truncate">{income.description}</h3>
                        <Badge className={`text-xs ${getStatusBadge(income.status)}`}>
                          {income.status}
                        </Badge>
                        {income.paymentMethod && (
                          <Badge className={`text-xs ${getPaymentMethodBadge(income.paymentMethod)}`}>
                            {formatPaymentMethod(income.paymentMethod)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{income.category}</span>
                        </div>
                        {income.source && (
                          <div className="flex items-center gap-1">
                            <span>From: {income.source}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(income.incomeDate)}</span>
                        </div>
                        {income.reference && (
                          <div className="flex items-center gap-1">
                            <span>Ref: {income.reference}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{formatCurrency(Number(income.amount))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewIncome(income)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditIncome(income.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIncome(income.id)}
                          disabled={deleting === income.id}
                        >
                          {deleting === income.id ? (
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

        {/* View Income Modal */}
        {showViewModal && selectedIncome && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Income Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID</label>
                    <p className="text-sm text-foreground">{selectedIncome.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-sm text-foreground">{selectedIncome.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-sm font-semibold text-green-600">+{formatCurrency(Number(selectedIncome.amount))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedIncome.status)}`}>
                      {selectedIncome.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm text-foreground">{formatPaymentMethod(selectedIncome.paymentMethod)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-sm text-foreground">{formatDate(selectedIncome.incomeDate)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-foreground">{selectedIncome.description}</p>
                </div>

                {selectedIncome.source && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Source</label>
                    <p className="text-sm text-foreground">{selectedIncome.source}</p>
                  </div>
                )}

                {selectedIncome.reference && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reference</label>
                    <p className="text-sm text-foreground">{selectedIncome.reference}</p>
                  </div>
                )}

                {selectedIncome.event && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Related Event</label>
                    <p className="text-sm text-foreground">{selectedIncome.event.title}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewModal(false);
                  handleEditIncome(selectedIncome.id);
                }}>
                  Edit Income
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default IncomePage;
