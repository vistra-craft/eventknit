import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Eye, Edit, Trash2, Calendar, User, DollarSign, X, AlertCircle, Briefcase, Clock, MapPin } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getWages, deleteWage, type Wage } from "@/lib/platform-finance-api";
import { useToast } from "@/hooks/useToast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showErrorToast } from "@/lib/utils/error";

const WagesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wages, setWages] = useState<Wage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [staffTypeFilter, setStaffTypeFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedWage, setSelectedWage] = useState<Wage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);


  const fetchWages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWages({
        limit: 200,
        staffType: staffTypeFilter !== "all" ? staffTypeFilter : undefined,
      });
      if (response.success && response.data) {
        const wageEntries = Array.isArray(response.data) ? response.data : [];
        setWages(wageEntries);
      } else {
        setError('Failed to fetch wages');
      }
    } catch (err) {
      console.error('Error fetching wages:', err);
      setError('Failed to load wage records');
    } finally {
      setLoading(false);
    }
  }, [staffTypeFilter]);

  useEffect(() => {
    fetchWages();
  }, [fetchWages]);

  // Filter wages client-side
  const filteredWages = useMemo(() => {
    return wages.filter(wage => {
      const matchesSearch = wage.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (wage.department && wage.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (wage.position && wage.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (wage.event?.title && wage.event.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || wage.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [wages, searchTerm, statusFilter]);

  // Calculate totals
  const totalPaid = useMemo(() => {
    return wages
      .filter(w => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + Number(w.amount), 0);
  }, [wages]);

  const pendingAmount = useMemo(() => {
    return wages
      .filter(w => w.status === 'PENDING')
      .reduce((sum, w) => sum + Number(w.amount), 0);
  }, [wages]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      COMPLETED: "bg-success/10 text-success border-success/20",
      PENDING: "bg-warning/10 text-warning border-warning/20",
      CANCELLED: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return variants[status] || "bg-muted text-muted-foreground border-border";
  };

  const getStaffTypeBadge = (type: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      PERMANENT: { className: "bg-primary/10 text-primary border-primary/20", label: "Permanent" },
      CONTRACT: { className: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Contract" },
      EVENT: { className: "bg-teal-500/10 text-teal-600 border-teal-500/20", label: "Event-Based" },
    };
    return variants[type] || { className: "bg-muted text-muted-foreground border-border", label: type };
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return "bg-muted text-muted-foreground border-border";
    const variants: Record<string, string> = {
      BANK_TRANSFER: "bg-primary/10 text-primary border-primary/20",
      CHECK: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      CASH: "bg-muted text-muted-foreground border-border",
      MPESA: "bg-success/10 text-success border-success/20",
      MOBILE_MONEY: "bg-teal-500/10 text-teal-600 border-teal-500/20"
    };
    return variants[method] || "bg-muted text-muted-foreground border-border";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return 'N/A';
    return method.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDeleteWage = (id: string) => setDeleteConfirm(id);

  const confirmDeleteWage = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm;
    setDeleteConfirm(null);
    try {
      setDeleting(id);
      const response = await deleteWage(id);
      if (response.success) {
        setWages(wages.filter(w => w.id !== id));
        toast({ title: "Wage Deleted", description: "The wage record has been deleted successfully." });
      } else {
        throw new Error('Failed to delete wage');
      }
    } catch (err) {
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
          <h1 className="text-lg font-semibold text-foreground">Staff Salaries & Wages</h1>
          <p className="text-muted-foreground">Track permanent, contract, and event-based staff pay</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/finance')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Finance Dashboard
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/finance/wages/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Wage
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/40 bg-card">
          <CardContent className="p-5 text-center">
            <div className="font-semibold text-destructive mb-1">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card">
          <CardContent className="p-5 text-center">
            <div className="font-semibold text-warning mb-1">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Pending Payments</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card">
          <CardContent className="p-5 text-center">
            <div className="font-semibold text-foreground mb-1">{wages.length}</div>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card">
          <CardContent className="p-5 text-center">
            <div className="font-semibold text-primary mb-1">
              {wages.filter(w => w.staffType === 'EVENT').length}
            </div>
            <p className="text-xs text-muted-foreground">Event-Based Entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/40 bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, department, position, or event..."
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
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={staffTypeFilter} onValueChange={setStaffTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Staff Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PERMANENT">Permanent</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="EVENT">Event-Based</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Wages List */}
      {filteredWages.length === 0 ? (
        <Card className="border-border/40 bg-card">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No wage records found</h3>
            <p className="text-muted-foreground">Try adjusting your filters, or add a new wage entry</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWages.map((wage) => {
            const staffBadge = getStaffTypeBadge(wage.staffType);
            return (
              <Card key={wage.id} className="border-border/40 bg-card hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{wage.employeeName}</h3>
                        <Badge className={`text-xs ${getStatusBadge(wage.status)}`}>{wage.status}</Badge>
                        <Badge className={`text-xs ${staffBadge.className}`}>{staffBadge.label}</Badge>
                        {wage.paymentMethod && (
                          <Badge className={`text-xs ${getPaymentMethodBadge(wage.paymentMethod)}`}>
                            {formatPaymentMethod(wage.paymentMethod)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-1">
                        {wage.position && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            <span>{wage.position}</span>
                          </div>
                        )}
                        {wage.department && (
                          <span className="text-muted-foreground">• {wage.department}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{wage.payPeriod}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(wage.payDate)}</span>
                        </div>
                      </div>
                      {wage.event && (
                        <div className="flex items-center gap-1 text-sm text-primary mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{wage.event.title}</span>
                          {wage.eventDays && <span className="text-muted-foreground">({wage.eventDays} days)</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          -{formatCurrency(Number(wage.amount))}
                        </p>
                        {Number(wage.grossAmount) !== Number(wage.amount) && (
                          <p className="text-xs text-muted-foreground">
                            Gross: {formatCurrency(Number(wage.grossAmount))}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedWage(wage); setShowViewModal(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/finance/wages/edit/${wage.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteWage(wage.id)} disabled={deleting === wage.id}>
                          {deleting === wage.id ? <Loader size="sm" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedWage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Wage Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee</label>
                  <p className="text-sm text-foreground">{selectedWage.employeeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Staff Type</label>
                  <Badge className={`text-xs ${getStaffTypeBadge(selectedWage.staffType).className}`}>
                    {getStaffTypeBadge(selectedWage.staffType).label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                  <p className="text-sm text-foreground">{selectedWage.position || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="text-sm text-foreground">{selectedWage.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gross Amount</label>
                  <p className="text-sm text-foreground">{formatCurrency(Number(selectedWage.grossAmount))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Net Pay</label>
                  <p className="text-sm font-semibold text-destructive">{formatCurrency(Number(selectedWage.amount))}</p>
                </div>
                {selectedWage.hoursWorked && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hours Worked</label>
                    <p className="text-sm text-foreground">{selectedWage.hoursWorked}h @ {formatCurrency(Number(selectedWage.hourlyRate || 0))}/hr</p>
                  </div>
                )}
                {selectedWage.overtimeHours && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Overtime</label>
                    <p className="text-sm text-foreground">{selectedWage.overtimeHours}h @ {formatCurrency(Number(selectedWage.overtimeRate || 0))}/hr</p>
                  </div>
                )}
                {selectedWage.dailyRate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Daily Rate</label>
                    <p className="text-sm text-foreground">{formatCurrency(Number(selectedWage.dailyRate))} × {selectedWage.eventDays || 0} days</p>
                  </div>
                )}
                {selectedWage.bonuses && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bonuses</label>
                    <p className="text-sm text-success">+{formatCurrency(Number(selectedWage.bonuses))}</p>
                  </div>
                )}
                {selectedWage.deductions && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Deductions</label>
                    <p className="text-sm text-destructive">-{formatCurrency(Number(selectedWage.deductions))}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pay Period</label>
                  <p className="text-sm text-foreground">{selectedWage.payPeriod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pay Date</label>
                  <p className="text-sm text-foreground">{formatDate(selectedWage.payDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="text-sm text-foreground">{formatPaymentMethod(selectedWage.paymentMethod)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reference</label>
                  <p className="text-sm text-foreground">{selectedWage.reference || 'N/A'}</p>
                </div>
                {selectedWage.event && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Event</label>
                    <p className="text-sm text-primary">{selectedWage.event.title}</p>
                  </div>
                )}
              </div>
              {selectedWage.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm text-foreground">{selectedWage.notes}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button onClick={() => { setShowViewModal(false); navigate(`/admin/finance/wages/edit/${selectedWage.id}`); }}>
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
