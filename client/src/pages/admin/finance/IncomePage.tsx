import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Plus, Search, Eye, Edit, Trash2, Calendar, Receipt, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../AdminLayout";

interface Income {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  source: string;
  status: "completed" | "pending" | "cancelled";
  paymentMethod: "cash" | "bank_transfer" | "credit_card" | "check";
  receipt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const mockIncome: Income[] = [
  {
    id: "1",
    category: "Event Registration",
    description: "Tech Conference 2024 registration fees",
    amount: 15000,
    date: "2024-01-28",
    source: "EventKnit Platform",
    status: "completed",
    paymentMethod: "bank_transfer",
    receipt: "receipt_001.pdf",
    notes: "Revenue from event registrations",
    createdBy: "admin_001",
    createdAt: "2024-01-28 14:30:00"
  },
  {
    id: "2",
    category: "Subscription",
    description: "Premium subscription revenue",
    amount: 3500,
    date: "2024-01-24",
    source: "EventKnit Platform",
    status: "completed",
    paymentMethod: "bank_transfer",
    notes: "Monthly subscription revenue",
    createdBy: "admin_001",
    createdAt: "2024-01-24 10:15:00"
  },
  {
    id: "3",
    category: "Consulting",
    description: "Event management consulting services",
    amount: 5000,
    date: "2024-01-22",
    source: "ABC Corporation",
    status: "completed",
    paymentMethod: "bank_transfer",
    receipt: "receipt_002.pdf",
    notes: "Consulting services for corporate event",
    createdBy: "admin_002",
    createdAt: "2024-01-22 16:45:00"
  },
  {
    id: "4",
    category: "Partnership",
    description: "Revenue sharing from partner events",
    amount: 2800,
    date: "2024-01-20",
    source: "Event Partners LLC",
    status: "completed",
    paymentMethod: "bank_transfer",
    notes: "Revenue share from partner events",
    createdBy: "admin_001",
    createdAt: "2024-01-20 12:00:00"
  },
  {
    id: "5",
    category: "Advertising",
    description: "Sponsored content revenue",
    amount: 1200,
    date: "2024-01-18",
    source: "Marketing Agency",
    status: "pending",
    paymentMethod: "bank_transfer",
    notes: "Sponsored content for event promotion",
    createdBy: "admin_003",
    createdAt: "2024-01-18 09:30:00"
  },
  {
    id: "6",
    category: "Merchandise",
    description: "Event merchandise sales",
    amount: 800,
    date: "2024-01-15",
    source: "EventKnit Store",
    status: "completed",
    paymentMethod: "credit_card",
    receipt: "receipt_003.pdf",
    notes: "Sales from event merchandise",
    createdBy: "admin_002",
    createdAt: "2024-01-15 14:20:00"
  }
];

const IncomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  const filteredIncome = mockIncome.filter(income => {
    const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || income.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || income.status === statusFilter;
    const matchesSource = sourceFilter === "all" || income.source === sourceFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesSource;
  });

  const totalIncome = mockIncome
    .filter(i => i.status === "completed")
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingIncome = mockIncome
    .filter(i => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      cash: "bg-gray-100 text-gray-800 border-gray-200",
      bank_transfer: "bg-blue-100 text-blue-800 border-blue-200",
      credit_card: "bg-purple-100 text-purple-800 border-purple-200",
      check: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return variants[method as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleAddIncome = () => {
    console.log("Adding new income");
    // TODO: Implement add income logic
  };

  const handleViewIncome = (income: Income) => {
    setSelectedIncome(income);
    setShowViewModal(true);
  };

  const handleEditIncome = (id: string) => {
    navigate(`/admin/finance/income/edit/${id}`);
  };

  const handleDeleteIncome = (id: string) => {
    if (window.confirm("Are you sure you want to delete this income record? This action cannot be undone.")) {
      console.log("Deleting income:", id);
      // TODO: Implement delete income logic
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Income Tracking</h1>
            <p className="text-gray-600">Track and manage all company income sources</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Receipt className="h-4 w-4 mr-2" />
              View Receipts
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
                {mockIncome.length}
              </div>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <SelectItem value="Event Registration">Event Registration</SelectItem>
                  <SelectItem value="Subscription">Subscription</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Advertising">Advertising</SelectItem>
                  <SelectItem value="Merchandise">Merchandise</SelectItem>
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
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="EventKnit Platform">EventKnit Platform</SelectItem>
                  <SelectItem value="ABC Corporation">ABC Corporation</SelectItem>
                  <SelectItem value="Event Partners LLC">Event Partners LLC</SelectItem>
                  <SelectItem value="Marketing Agency">Marketing Agency</SelectItem>
                  <SelectItem value="EventKnit Store">EventKnit Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Income List */}
        <div className="space-y-3">
          {filteredIncome.map((income) => (
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
                      <Badge className={`text-xs ${getPaymentMethodBadge(income.paymentMethod)}`}>
                        {income.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{income.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>From: {income.source}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(income.date)}</span>
                      </div>
                      {income.receipt && (
                        <div className="flex items-center gap-1">
                          <Receipt className="h-4 w-4" />
                          <span>Receipt available</span>
                        </div>
                      )}
                    </div>
                    {income.notes && (
                      <p className="text-sm text-gray-600 mb-2">{income.notes}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created by {income.createdBy} on {formatDate(income.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(income.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewIncome(income)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditIncome(income.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteIncome(income.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIncome.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No income records found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Income Modal */}
        {showViewModal && selectedIncome && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-base font-semibold text-gray-900">Income Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Income ID</label>
                    <p className="text-sm text-gray-900">{selectedIncome.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-sm text-gray-900">{selectedIncome.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-sm font-semibold text-green-600">+{formatCurrency(selectedIncome.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedIncome.status)}`}>
                      {selectedIncome.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedIncome.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedIncome.date)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-900">{selectedIncome.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Source</label>
                  <p className="text-sm text-gray-900">{selectedIncome.source}</p>
                </div>

                {selectedIncome.receipt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Receipt</label>
                    <p className="text-sm text-gray-900">{selectedIncome.receipt}</p>
                  </div>
                )}

                {selectedIncome.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-sm text-gray-900">{selectedIncome.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created By</label>
                    <p className="text-sm text-gray-900">{selectedIncome.createdBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedIncome.createdAt)}</p>
                  </div>
                </div>
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
