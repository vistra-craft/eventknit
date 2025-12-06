import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, Eye, Search } from "lucide-react";
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
    paymentMethod: "bank_transfer"
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
    paymentMethod: "credit_card"
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
    paymentMethod: "bank_transfer"
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
    paymentMethod: "bank_transfer"
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
    paymentMethod: "credit_card"
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
    paymentMethod: "bank_transfer"
  }
];

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter] = useState("all");

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.source && transaction.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
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
            <h1 className="text-lg font-semibold text-gray-900">Finance Dashboard</h1>
            <p className="text-gray-600">Track income, expenses, and financial performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/finance/income-statement')}>
              <Eye className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-green-600 text-sm font-medium">+12.5%</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Income</h3>
                <p className="font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
                <p className="text-sm text-gray-600">This month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-red-100">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-red-600 text-sm font-medium">+8.2%</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Total Expenses</h3>
                <p className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-gray-600">This month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}15.3%
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Net Profit</h3>
                <p className={`font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-sm text-gray-600">This month</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-purple-600 text-sm font-medium">4</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Pending Payments</h3>
                <p className="font-semibold text-purple-600">
                  {formatCurrency(mockTransactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0))}
                </p>
                <p className="text-sm text-gray-600">Awaiting processing</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
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
                </SelectContent>
              </Select>
            </div>
          </div>

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
                        <h3 className="text-lg font-semibold text-foreground">{transaction.description}</h3>
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
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{transaction.category}</span>
                        {transaction.source && (
                          <span>From: {transaction.source}</span>
                        )}
                        {transaction.recipient && (
                          <span>To: {transaction.recipient}</span>
                        )}
                        <span>Date: {formatDate(transaction.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinanceDashboard;
