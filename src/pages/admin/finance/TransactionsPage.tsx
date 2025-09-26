import { useState } from "react";
import { CreditCard, Search, Filter, Eye, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "income",
    category: "Event Registration",
    description: "Tech Conference 2024 registration fees",
    amount: 15000,
    date: "2024-01-28",
    source: "EventKnit Platform",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-001",
    createdBy: "admin_001",
    createdAt: "2024-01-28 14:30:00"
  },
  {
    id: "2",
    type: "expense",
    category: "Marketing",
    description: "Google Ads campaign for Q1 2024",
    amount: 2500,
    date: "2024-01-27",
    recipient: "Google LLC",
    status: "completed",
    paymentMethod: "credit_card",
    reference: "TXN-002",
    createdBy: "admin_001",
    createdAt: "2024-01-27 10:30:00"
  },
  {
    id: "3",
    type: "expense",
    category: "Wages",
    description: "Monthly salary for development team",
    amount: 12000,
    date: "2024-01-25",
    recipient: "Development Team",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-003",
    createdBy: "admin_001",
    createdAt: "2024-01-25 09:00:00"
  },
  {
    id: "4",
    type: "income",
    category: "Subscription",
    description: "Premium subscription revenue",
    amount: 3500,
    date: "2024-01-24",
    source: "EventKnit Platform",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-004",
    createdBy: "admin_001",
    createdAt: "2024-01-24 10:15:00"
  },
  {
    id: "5",
    type: "expense",
    category: "Office Supplies",
    description: "Office equipment and supplies",
    amount: 800,
    date: "2024-01-23",
    recipient: "Office Depot",
    status: "pending",
    paymentMethod: "credit_card",
    reference: "TXN-005",
    createdBy: "admin_002",
    createdAt: "2024-01-23 14:15:00"
  },
  {
    id: "6",
    type: "expense",
    category: "Utilities",
    description: "Monthly office rent and utilities",
    amount: 4500,
    date: "2024-01-20",
    recipient: "Property Management",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-006",
    createdBy: "admin_001",
    createdAt: "2024-01-20 08:00:00"
  },
  {
    id: "7",
    type: "income",
    category: "Consulting",
    description: "Event management consulting services",
    amount: 5000,
    date: "2024-01-22",
    source: "ABC Corporation",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "TXN-007",
    createdBy: "admin_002",
    createdAt: "2024-01-22 16:45:00"
  },
  {
    id: "8",
    type: "expense",
    category: "Software",
    description: "Annual software licenses",
    amount: 3200,
    date: "2024-01-18",
    recipient: "Software Vendor",
    status: "completed",
    paymentMethod: "credit_card",
    reference: "TXN-008",
    createdBy: "admin_003",
    createdAt: "2024-01-18 16:45:00"
  }
];

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.source && transaction.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
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
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
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
      </div>
    </AdminLayout>
  );
};

export default TransactionsPage;
