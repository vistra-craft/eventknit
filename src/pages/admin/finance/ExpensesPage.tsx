import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingDown, Plus, Search, Filter, Eye, Edit, Trash2, Calendar, CreditCard, Receipt, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../AdminLayout";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recipient: string;
  status: "completed" | "pending" | "cancelled";
  paymentMethod: "cash" | "bank_transfer" | "credit_card" | "check";
  receipt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const mockExpenses: Expense[] = [
  {
    id: "1",
    category: "Marketing",
    description: "Google Ads campaign for Q1 2024",
    amount: 2500,
    date: "2024-01-27",
    recipient: "Google LLC",
    status: "completed",
    paymentMethod: "credit_card",
    receipt: "receipt_001.pdf",
    notes: "Campaign targeting tech events and conferences",
    createdBy: "admin_001",
    createdAt: "2024-01-27 10:30:00"
  },
  {
    id: "2",
    category: "Wages",
    description: "Monthly salary for development team",
    amount: 12000,
    date: "2024-01-25",
    recipient: "Development Team",
    status: "completed",
    paymentMethod: "bank_transfer",
    notes: "Regular monthly payroll",
    createdBy: "admin_001",
    createdAt: "2024-01-25 09:00:00"
  },
  {
    id: "3",
    category: "Office Supplies",
    description: "Office equipment and supplies",
    amount: 800,
    date: "2024-01-23",
    recipient: "Office Depot",
    status: "pending",
    paymentMethod: "credit_card",
    receipt: "receipt_002.pdf",
    notes: "New office chairs and stationery",
    createdBy: "admin_002",
    createdAt: "2024-01-23 14:15:00"
  },
  {
    id: "4",
    category: "Utilities",
    description: "Monthly office rent and utilities",
    amount: 4500,
    date: "2024-01-20",
    recipient: "Property Management",
    status: "completed",
    paymentMethod: "bank_transfer",
    notes: "Monthly office rent payment",
    createdBy: "admin_001",
    createdAt: "2024-01-20 08:00:00"
  },
  {
    id: "5",
    category: "Software",
    description: "Annual software licenses",
    amount: 3200,
    date: "2024-01-18",
    recipient: "Software Vendor",
    status: "completed",
    paymentMethod: "credit_card",
    receipt: "receipt_003.pdf",
    notes: "Development tools and productivity software",
    createdBy: "admin_003",
    createdAt: "2024-01-18 16:45:00"
  },
  {
    id: "6",
    category: "Travel",
    description: "Business travel expenses",
    amount: 1800,
    date: "2024-01-15",
    recipient: "Travel Agency",
    status: "completed",
    paymentMethod: "credit_card",
    receipt: "receipt_004.pdf",
    notes: "Conference attendance and accommodation",
    createdBy: "admin_002",
    createdAt: "2024-01-15 11:20:00"
  }
];

const ExpensesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const filteredExpenses = mockExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === "all" || expense.paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPaymentMethod;
  });

  const totalExpenses = mockExpenses
    .filter(e => e.status === "completed")
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingExpenses = mockExpenses
    .filter(e => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

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

  const handleAddExpense = () => {
    console.log("Adding new expense");
    // TODO: Implement add expense logic
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  const handleEditExpense = (id: string) => {
    navigate(`/admin/finance/expenses/edit/${id}`);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
      console.log("Deleting expense:", id);
      // TODO: Implement delete expense logic
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
            <p className="text-gray-600">Track and manage all company expenses</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Receipt className="h-4 w-4 mr-2" />
              View Receipts
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
              <div className="text-2xl font-bold text-red-600 mb-2">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-sm text-gray-600">Total Expenses</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {formatCurrency(pendingExpenses)}
              </div>
              <p className="text-sm text-gray-600">Pending Payments</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-600 mb-2">
                {mockExpenses.length}
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
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Wages">Wages</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
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
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-red-100">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{expense.description}</h3>
                      <Badge className={`text-xs ${getStatusBadge(expense.status)}`}>
                        {expense.status}
                      </Badge>
                      <Badge className={`text-xs ${getPaymentMethodBadge(expense.paymentMethod)}`}>
                        {expense.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{expense.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>To: {expense.recipient}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(expense.date)}</span>
                      </div>
                      {expense.receipt && (
                        <div className="flex items-center gap-1">
                          <Receipt className="h-4 w-4" />
                          <span>Receipt available</span>
                        </div>
                      )}
                    </div>
                    {expense.notes && (
                      <p className="text-sm text-gray-600 mb-2">{expense.notes}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created by {expense.createdBy} on {formatDate(expense.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewExpense(expense)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditExpense(expense.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExpenses.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No expenses found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Expense Modal */}
        {showViewModal && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-gray-900">Expense Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expense ID</label>
                    <p className="text-sm text-gray-900">{selectedExpense.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-sm text-gray-900">{selectedExpense.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-sm font-semibold text-red-600">-{formatCurrency(selectedExpense.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedExpense.status)}`}>
                      {selectedExpense.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedExpense.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedExpense.date)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-900">{selectedExpense.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Recipient</label>
                  <p className="text-sm text-gray-900">{selectedExpense.recipient}</p>
                </div>

                {selectedExpense.receipt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Receipt</label>
                    <p className="text-sm text-gray-900">{selectedExpense.receipt}</p>
                  </div>
                )}

                {selectedExpense.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-sm text-gray-900">{selectedExpense.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created By</label>
                    <p className="text-sm text-gray-900">{selectedExpense.createdBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedExpense.createdAt)}</p>
                  </div>
                </div>
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
      </div>
    </AdminLayout>
  );
};

export default ExpensesPage;
