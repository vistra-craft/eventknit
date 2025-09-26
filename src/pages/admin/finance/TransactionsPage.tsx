import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Search, Eye, Calendar, TrendingUp, TrendingDown, DollarSign, Edit, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../AdminLayout";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  source?: string;
  recipient?: string;
  status: "completed" | "pending" | "cancelled";
  paymentMethod: "cash" | "bank_transfer" | "credit_card" | "check";
  reference?: string;
  createdBy: string;
  createdAt: string;
  // New fields for ticket purchases and organizer payments
  eventId?: string;
  eventName?: string;
  attendeeId?: string;
  attendeeName?: string;
  organizerId?: string;
  organizerName?: string;
  ticketType?: string;
  ticketQuantity?: number;
  platformFee?: number;
  organizerAmount?: number;
  transactionType?: "ticket_purchase" | "organizer_payment" | "platform_fee" | "other";
}

const mockTransactions: Transaction[] = [
  // Ticket Purchase Transactions (Income for Platform)
  {
    id: "1",
    type: "income",
    category: "Ticket Sales",
    description: "Tech Conference 2024 - VIP Ticket Purchase",
    amount: 150,
    date: "2024-01-28",
    source: "John Doe",
    status: "completed",
    paymentMethod: "credit_card",
    reference: "TXN-001",
    createdBy: "system",
    createdAt: "2024-01-28 14:30:00",
    eventId: "EVT-001",
    eventName: "Tech Conference 2024",
    attendeeId: "ATT-001",
    attendeeName: "John Doe",
    organizerId: "ORG-001",
    organizerName: "Tech Events Inc",
    ticketType: "VIP",
    ticketQuantity: 1,
    platformFee: 15,
    organizerAmount: 135,
    transactionType: "ticket_purchase"
  },
  {
    id: "2",
    type: "income",
    category: "Ticket Sales",
    description: "Music Festival 2024 - General Admission",
    amount: 75,
    date: "2024-01-27",
    source: "Sarah Johnson",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-002",
    createdBy: "system",
    createdAt: "2024-01-27 10:30:00",
    eventId: "EVT-002",
    eventName: "Music Festival 2024",
    attendeeId: "ATT-002",
    attendeeName: "Sarah Johnson",
    organizerId: "ORG-002",
    organizerName: "Music Events LLC",
    ticketType: "General Admission",
    ticketQuantity: 2,
    platformFee: 7.5,
    organizerAmount: 67.5,
    transactionType: "ticket_purchase"
  },
  // Organizer Payment Transactions (Expense for Platform)
  {
    id: "3",
    type: "expense",
    category: "Organizer Payments",
    description: "Payment to Tech Events Inc - Tech Conference 2024",
    amount: 1350,
    date: "2024-01-29",
    recipient: "Tech Events Inc",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-003",
    createdBy: "admin_001",
    createdAt: "2024-01-29 09:00:00",
    eventId: "EVT-001",
    eventName: "Tech Conference 2024",
    organizerId: "ORG-001",
    organizerName: "Tech Events Inc",
    transactionType: "organizer_payment"
  },
  {
    id: "4",
    type: "expense",
    category: "Organizer Payments",
    description: "Payment to Music Events LLC - Music Festival 2024",
    amount: 675,
    date: "2024-01-28",
    recipient: "Music Events LLC",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-004",
    createdBy: "admin_001",
    createdAt: "2024-01-28 16:00:00",
    eventId: "EVT-002",
    eventName: "Music Festival 2024",
    organizerId: "ORG-002",
    organizerName: "Music Events LLC",
    transactionType: "organizer_payment"
  },
  // Platform Fee Transactions (Income for Platform)
  {
    id: "5",
    type: "income",
    category: "Platform Fees",
    description: "Platform fee from Tech Conference 2024",
    amount: 150,
    date: "2024-01-28",
    source: "EventKnit Platform",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-005",
    createdBy: "system",
    createdAt: "2024-01-28 14:30:00",
    eventId: "EVT-001",
    eventName: "Tech Conference 2024",
    organizerId: "ORG-001",
    organizerName: "Tech Events Inc",
    platformFee: 150,
    transactionType: "platform_fee"
  },
  // Other Business Transactions
  {
    id: "6",
    type: "expense",
    category: "Marketing",
    description: "Google Ads campaign for Q1 2024",
    amount: 2500,
    date: "2024-01-27",
    recipient: "Google LLC",
    status: "completed",
    paymentMethod: "credit_card",
    reference: "TXN-006",
    createdBy: "admin_001",
    createdAt: "2024-01-27 10:30:00",
    transactionType: "other"
  },
  {
    id: "7",
    type: "expense",
    category: "Wages",
    description: "Monthly salary for development team",
    amount: 12000,
    date: "2024-01-25",
    recipient: "Development Team",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-007",
    createdBy: "admin_001",
    createdAt: "2024-01-25 09:00:00",
    transactionType: "other"
  },
  {
    id: "8",
    type: "income",
    category: "Subscription",
    description: "Premium subscription revenue",
    amount: 3500,
    date: "2024-01-24",
    source: "EventKnit Platform",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-008",
    createdBy: "admin_001",
    createdAt: "2024-01-24 10:15:00",
    transactionType: "other"
  }
];

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.source && transaction.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.eventName && transaction.eventName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.attendeeName && transaction.attendeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.organizerName && transaction.organizerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesTransactionType = transactionTypeFilter === "all" || transaction.transactionType === transactionTypeFilter;
    
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
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesDate && matchesTransactionType;
  });

  const totalIncome = mockTransactions
    .filter(t => t.type === "income" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = mockTransactions
    .filter(t => t.type === "expense" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeBadge = (type: string) => {
    return type === "income" 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
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

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const handleEditTransaction = (id: string) => {
    navigate(`/admin/finance/transactions/edit/${id}`);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      console.log("Deleting transaction:", id);
      // TODO: Implement delete logic
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      ticket_purchase: "bg-blue-100 text-blue-800 border-blue-200",
      organizer_payment: "bg-purple-100 text-purple-800 border-purple-200",
      platform_fee: "bg-green-100 text-green-800 border-green-200",
      other: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return variants[type as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction Overview</h1>
            <p className="text-gray-600">View all financial transactions and their details</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial Summary
            </Button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-sm text-gray-600">Total Income</p>
            </CardContent>
          </Card>
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
              <div className={`text-2xl font-bold mb-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-sm text-gray-600">Net Profit</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  <SelectItem value="Event Registration">Event Registration</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Wages">Wages</SelectItem>
                  <SelectItem value="Subscription">Subscription</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
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
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ticket_purchase">Ticket Purchase</SelectItem>
                  <SelectItem value="organizer_payment">Organizer Payment</SelectItem>
                  <SelectItem value="platform_fee">Platform Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}>
                        {transaction.type === "income" ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{transaction.description}</h3>
                      <Badge className={`text-xs ${getTypeBadge(transaction.type)}`}>
                        {transaction.type}
                      </Badge>
                      <Badge className={`text-xs ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </Badge>
                      <Badge className={`text-xs ${getPaymentMethodBadge(transaction.paymentMethod)}`}>
                        {transaction.paymentMethod.replace('_', ' ')}
                      </Badge>
                      {transaction.transactionType && (
                        <Badge className={`text-xs ${getTransactionTypeBadge(transaction.transactionType)}`}>
                          {transaction.transactionType.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
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
                      {transaction.eventName && (
                        <div className="flex items-center gap-1">
                          <span>Event: {transaction.eventName}</span>
                        </div>
                      )}
                      {transaction.attendeeName && (
                        <div className="flex items-center gap-1">
                          <span>Attendee: {transaction.attendeeName}</span>
                        </div>
                      )}
                      {transaction.organizerName && (
                        <div className="flex items-center gap-1">
                          <span>Organizer: {transaction.organizerName}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created by {transaction.createdBy} on {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewTransaction(transaction)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditTransaction(transaction.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTransaction(transaction.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Transaction Modal */}
        {showViewModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reference</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.reference || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className={`text-sm font-semibold ${selectedTransaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {selectedTransaction.type === "income" ? "+" : "-"}{formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedTransaction.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedTransaction.date)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>

                {selectedTransaction.source && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Source</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.source}</p>
                  </div>
                )}

                {selectedTransaction.recipient && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Recipient</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.recipient}</p>
                  </div>
                )}

                {selectedTransaction.eventName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Event</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.eventName}</p>
                  </div>
                )}

                {selectedTransaction.attendeeName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Attendee</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.attendeeName}</p>
                  </div>
                )}

                {selectedTransaction.organizerName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Organizer</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.organizerName}</p>
                  </div>
                )}

                {selectedTransaction.ticketType && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ticket Type</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.ticketType}</p>
                  </div>
                )}

                {selectedTransaction.ticketQuantity && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantity</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.ticketQuantity}</p>
                  </div>
                )}

                {selectedTransaction.platformFee && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Platform Fee</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedTransaction.platformFee)}</p>
                  </div>
                )}

                {selectedTransaction.organizerAmount && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Organizer Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedTransaction.organizerAmount)}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created By</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.createdBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewModal(false);
                  handleEditTransaction(selectedTransaction.id);
                }}>
                  Edit Transaction
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TransactionsPage;
