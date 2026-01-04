import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/pages/admin/AdminLayout';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from "@/components/BackButton";

interface IncomeStatementData {
  period: string;
  revenue: {
    eventRegistration: number;
    subscriptions: number;
    platformFees: number;
    otherIncome: number;
    totalRevenue: number;
  };
  expenses: {
    costOfGoodsSold: number;
    marketing: number;
    wages: number;
    utilities: number;
    officeSupplies: number;
    otherExpenses: number;
    totalExpenses: number;
  };
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
}

const IncomeStatementPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [viewMode, setViewMode] = useState<'statement' | 'chart'>('statement');

  // Mock data - in a real app, this would come from your API
  const incomeStatementData: IncomeStatementData = {
    period: 'January 2024',
    revenue: {
      eventRegistration: 18500,
      subscriptions: 3500,
      platformFees: 2200,
      otherIncome: 800,
      totalRevenue: 25000
    },
    expenses: {
      costOfGoodsSold: 3200,
      marketing: 2500,
      wages: 12000,
      utilities: 4500,
      officeSupplies: 800,
      otherExpenses: 1200,
      totalExpenses: 24200
    },
    grossProfit: 21800,
    operatingIncome: 800,
    netIncome: 800
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-emerald-600' : 'text-red-500';
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/5 via-background to-muted/10 py-8">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BackButton label="Back" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-foreground">Income Statement</h1>
                    <p className="text-muted-foreground">Profit & Loss Report for {incomeStatementData.period}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border border-border rounded-lg">
                  <Button
                    variant={viewMode === 'statement' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('statement')}
                    className="rounded-r-none"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Statement
                  </Button>
                  <Button
                    variant={viewMode === 'chart' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('chart')}
                    className="rounded-l-none"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Chart
                  </Button>
                </div>
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-border bg-card hover:shadow-card transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">+12.5%</Badge>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</h3>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(incomeStatementData.revenue.totalRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card hover:shadow-card transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-red-50">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    </div>
                    <Badge className="bg-red-50 text-red-700 border-red-200">+8.2%</Badge>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</h3>
                  <p className="font-semibold text-red-500">
                    {formatCurrency(incomeStatementData.expenses.totalExpenses)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card hover:shadow-card transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">+15.3%</Badge>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Gross Profit</h3>
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(incomeStatementData.grossProfit)}
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-border bg-card hover:shadow-card transition-all duration-200 ${incomeStatementData.netIncome >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${incomeStatementData.netIncome >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {getTrendIcon(incomeStatementData.netIncome)}
                    </div>
                    <Badge className={incomeStatementData.netIncome >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                      {incomeStatementData.netIncome >= 0 ? '+15.3%' : '-5.2%'}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Net Income</h3>
                  <p className={`font-semibold ${getTrendColor(incomeStatementData.netIncome)}`}>
                    {formatCurrency(incomeStatementData.netIncome)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Income Statement Table */}
            <Card className="border-border bg-card">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-base font-semibold text-foreground flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Income Statement - {incomeStatementData.period}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/20 border-b">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Description</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground">Amount</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground">% of Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Revenue Section */}
                      <tr className="bg-emerald-50/30">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-emerald-700 text-lg">REVENUE</div>
                        </td>
                        <td className="py-4 px-6"></td>
                        <td className="py-4 px-6"></td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Event Registration Fees</td>
                        <td className="py-4 px-6 text-right font-medium text-emerald-600">
                          {formatCurrency(incomeStatementData.revenue.eventRegistration)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.revenue.eventRegistration, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Subscription Revenue</td>
                        <td className="py-4 px-6 text-right font-medium text-emerald-600">
                          {formatCurrency(incomeStatementData.revenue.subscriptions)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.revenue.subscriptions, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Platform Fees</td>
                        <td className="py-4 px-6 text-right font-medium text-emerald-600">
                          {formatCurrency(incomeStatementData.revenue.platformFees)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.revenue.platformFees, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Other Income</td>
                        <td className="py-4 px-6 text-right font-medium text-emerald-600">
                          {formatCurrency(incomeStatementData.revenue.otherIncome)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.revenue.otherIncome, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="bg-emerald-50/50 border-t-2 border-emerald-200">
                        <td className="py-4 px-6 font-bold text-emerald-700">Total Revenue</td>
                        <td className="py-4 px-6 text-right font-bold text-emerald-600 text-lg">
                          {formatCurrency(incomeStatementData.revenue.totalRevenue)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-emerald-600">100.0%</td>
                      </tr>

                      {/* Expenses Section */}
                      <tr className="bg-red-50/30">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-red-600 text-lg">EXPENSES</div>
                        </td>
                        <td className="py-4 px-6"></td>
                        <td className="py-4 px-6"></td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Cost of Goods Sold</td>
                        <td className="py-4 px-6 text-right font-medium text-red-500">
                          {formatCurrency(incomeStatementData.expenses.costOfGoodsSold)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.expenses.costOfGoodsSold, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Marketing & Advertising</td>
                        <td className="py-4 px-6 text-right font-medium text-red-500">
                          {formatCurrency(incomeStatementData.expenses.marketing)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.expenses.marketing, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Wages & Salaries</td>
                        <td className="py-4 px-6 text-right font-medium text-red-500">
                          {formatCurrency(incomeStatementData.expenses.wages)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.expenses.wages, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Utilities & Rent</td>
                        <td className="py-4 px-6 text-right font-medium text-red-500">
                          {formatCurrency(incomeStatementData.expenses.utilities)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.expenses.utilities, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Office Supplies</td>
                        <td className="py-4 px-6 text-right font-medium text-red-500">
                          {formatCurrency(incomeStatementData.expenses.officeSupplies)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.expenses.officeSupplies, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 pl-8 text-muted-foreground">Other Expenses</td>
                        <td className="py-4 px-6 text-right font-medium text-red-500">
                          {formatCurrency(incomeStatementData.expenses.otherExpenses)}
                        </td>
                        <td className="py-4 px-6 text-right text-muted-foreground">
                          {formatPercentage(incomeStatementData.expenses.otherExpenses, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>
                      
                      <tr className="bg-red-50/50 border-t-2 border-red-200">
                        <td className="py-4 px-6 font-bold text-red-600">Total Expenses</td>
                        <td className="py-4 px-6 text-right font-bold text-red-500 text-lg">
                          {formatCurrency(incomeStatementData.expenses.totalExpenses)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-red-500">
                          {formatPercentage(incomeStatementData.expenses.totalExpenses, incomeStatementData.revenue.totalRevenue)}%
                        </td>
                      </tr>

                      {/* Net Income */}
                      <tr className={`${incomeStatementData.netIncome >= 0 ? 'bg-emerald-50/50' : 'bg-red-50/50'} border-t-4 ${incomeStatementData.netIncome >= 0 ? 'border-emerald-300' : 'border-red-300'}`}>
                        <td className="py-6 px-6 font-bold text-lg">
                          <span className={incomeStatementData.netIncome >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                            NET INCOME
                          </span>
                        </td>
                        <td className="py-6 px-6 text-right font-bold text-xl">
                          <span className={getTrendColor(incomeStatementData.netIncome)}>
                            {formatCurrency(incomeStatementData.netIncome)}
                          </span>
                        </td>
                        <td className="py-6 px-6 text-right font-bold text-lg">
                          <span className={getTrendColor(incomeStatementData.netIncome)}>
                            {formatPercentage(Math.abs(incomeStatementData.netIncome), incomeStatementData.revenue.totalRevenue)}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-primary" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Event Registration</span>
                        <span className="font-medium text-foreground">{formatPercentage(incomeStatementData.revenue.eventRegistration, incomeStatementData.revenue.totalRevenue)}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${formatPercentage(incomeStatementData.revenue.eventRegistration, incomeStatementData.revenue.totalRevenue)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Subscriptions</span>
                        <span className="font-medium text-foreground">{formatPercentage(incomeStatementData.revenue.subscriptions, incomeStatementData.revenue.totalRevenue)}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${formatPercentage(incomeStatementData.revenue.subscriptions, incomeStatementData.revenue.totalRevenue)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Platform Fees</span>
                        <span className="font-medium text-foreground">{formatPercentage(incomeStatementData.revenue.platformFees, incomeStatementData.revenue.totalRevenue)}%</span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${formatPercentage(incomeStatementData.revenue.platformFees, incomeStatementData.revenue.totalRevenue)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600 mr-2" />
                        <span className="font-medium text-emerald-800">Strong Revenue Growth</span>
                      </div>
                      <p className="text-sm text-emerald-700">Revenue increased by 12.5% compared to last month</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Healthy Profit Margin</span>
                      </div>
                      <p className="text-sm text-blue-700">Net profit margin of {formatPercentage(incomeStatementData.netIncome, incomeStatementData.revenue.totalRevenue)}%</p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50/50 rounded-lg border border-yellow-200">
                      <div className="flex items-center mb-2">
                        <TrendingDown className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="font-medium text-yellow-800">Expense Management</span>
                      </div>
                      <p className="text-sm text-yellow-700">Consider optimizing wage costs which represent {formatPercentage(incomeStatementData.expenses.wages, incomeStatementData.revenue.totalRevenue)}% of revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IncomeStatementPage;
