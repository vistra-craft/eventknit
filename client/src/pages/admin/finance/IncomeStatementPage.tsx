import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import BackButton from "@/components/BackButton";
import {
  getMonthlySummary,
  getFinancialOverview,
  type MonthlySummary,
  type FinancialOverview,
} from '@/lib/accounting-api';

type Period = 'current-month' | 'last-month' | 'quarter' | 'year';

interface StatementData {
  period: string;
  revenue: {
    incomesByCategory: Record<string, number>;
    totalRevenue: number;
  };
  expenses: {
    expensesByCategory: Record<string, number>;
    totalExpenses: number;
  };
  netIncome: number;
}

function getPeriodDates(period: Period): { year: number; month: number | null; label: string } {
  const now = new Date();
  if (period === 'current-month') {
    return { year: now.getFullYear(), month: now.getMonth() + 1, label: now.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  }
  if (period === 'last-month') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  }
  if (period === 'quarter') {
    return { year: now.getFullYear(), month: null, label: `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}` };
  }
  return { year: now.getFullYear(), month: null, label: `Full Year ${now.getFullYear()}` };
}

const IncomeStatementPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('current-month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<StatementData | null>(null);

  const loadData = useCallback(async (period: Period) => {
    setLoading(true);
    setError(null);
    try {
      const { year, month, label } = getPeriodDates(period);

      if (month !== null) {
        // Monthly view — use getMonthlySummary
        const res = await getMonthlySummary(year, month);
        if (res.success && res.data) {
          const d: MonthlySummary = res.data;
          setStatement({
            period: label,
            revenue: {
              incomesByCategory: d.incomesByCategory,
              totalRevenue: d.summary.totalIncome,
            },
            expenses: {
              expensesByCategory: d.expensesByCategory,
              totalExpenses: d.summary.totalExpenses,
            },
            netIncome: d.summary.netProfit,
          });
        } else {
          setError('Failed to load income statement data');
        }
      } else {
        // Year/quarter view — use getFinancialOverview (no category breakdown available)
        const now = new Date();
        let startDate: string;
        if (period === 'quarter') {
          const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          startDate = qStart.toISOString();
        } else {
          startDate = new Date(year, 0, 1).toISOString();
        }
        const res = await getFinancialOverview({ startDate, endDate: now.toISOString() });
        if (res.success && res.data) {
          const d: FinancialOverview = res.data;
          setStatement({
            period: label,
            revenue: { incomesByCategory: {}, totalRevenue: d.totalIncome },
            expenses: { expensesByCategory: {}, totalExpenses: d.totalExpenses },
            netIncome: d.netProfit,
          });
        } else {
          setError('Failed to load income statement data');
        }
      }
    } catch {
      setError('Failed to load income statement data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod, loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return '0.0';
    return ((value / total) * 100).toFixed(1);
  };

  const getTrendColor = (value: number) => value >= 0 ? 'text-success' : 'text-destructive';

  return (
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
                  <p className="text-muted-foreground">
                    Profit & Loss Report{statement ? ` — ${statement.period}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as Period)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                Print / Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : statement ? (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/40 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-success/5">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</h3>
                  <p className="font-semibold text-success">{formatCurrency(statement.revenue.totalRevenue)}</p>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-destructive/5">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</h3>
                  <p className="font-semibold text-destructive">{formatCurrency(statement.expenses.totalExpenses)}</p>
                </CardContent>
              </Card>

              <Card className={`border-border/40 bg-card ${statement.netIncome >= 0 ? 'border-success/30' : 'border-destructive/30'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${statement.netIncome >= 0 ? 'bg-success/5' : 'bg-destructive/5'}`}>
                      <DollarSign className={`h-5 w-5 ${getTrendColor(statement.netIncome)}`} />
                    </div>
                    <Badge className={statement.netIncome >= 0 ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                      {statement.netIncome >= 0 ? 'Profit' : 'Loss'}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Net Income</h3>
                  <p className={`font-semibold ${getTrendColor(statement.netIncome)}`}>
                    {formatCurrency(statement.netIncome)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Income Statement Table */}
            <Card className="border-border/40 bg-card">
              <CardHeader className="bg-muted/30 border-b border-border/40">
                <CardTitle className="text-base font-semibold text-foreground flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Income Statement — {statement.period}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/20 border-b border-border/40">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-foreground">Description</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground">Amount</th>
                        <th className="text-right py-4 px-6 font-semibold text-foreground">% of Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {/* Revenue Section */}
                      <tr className="bg-success/5">
                        <td className="py-4 px-6 font-semibold text-success text-base">REVENUE</td>
                        <td /><td />
                      </tr>

                      {Object.entries(statement.revenue.incomesByCategory).length > 0 ? (
                        Object.entries(statement.revenue.incomesByCategory).map(([cat, amount]) => (
                          <tr key={cat} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-6 pl-10 text-muted-foreground">{cat}</td>
                            <td className="py-3 px-6 text-right font-medium text-success">{formatCurrency(amount)}</td>
                            <td className="py-3 px-6 text-right text-muted-foreground">
                              {formatPercentage(amount, statement.revenue.totalRevenue)}%
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-6 pl-10 text-muted-foreground">Total Income</td>
                          <td className="py-3 px-6 text-right font-medium text-success">{formatCurrency(statement.revenue.totalRevenue)}</td>
                          <td className="py-3 px-6 text-right text-muted-foreground">100.0%</td>
                        </tr>
                      )}

                      <tr className="bg-success/5 border-t-2 border-success/20">
                        <td className="py-4 px-6 font-bold text-success">Total Revenue</td>
                        <td className="py-4 px-6 text-right font-bold text-success text-base">{formatCurrency(statement.revenue.totalRevenue)}</td>
                        <td className="py-4 px-6 text-right font-bold text-success">100.0%</td>
                      </tr>

                      {/* Expenses Section */}
                      <tr className="bg-destructive/5">
                        <td className="py-4 px-6 font-semibold text-destructive text-base">EXPENSES</td>
                        <td /><td />
                      </tr>

                      {Object.entries(statement.expenses.expensesByCategory).length > 0 ? (
                        Object.entries(statement.expenses.expensesByCategory).map(([cat, amount]) => (
                          <tr key={cat} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-6 pl-10 text-muted-foreground">{cat}</td>
                            <td className="py-3 px-6 text-right font-medium text-destructive">{formatCurrency(amount)}</td>
                            <td className="py-3 px-6 text-right text-muted-foreground">
                              {formatPercentage(amount, statement.revenue.totalRevenue)}%
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-6 pl-10 text-muted-foreground">Total Expenses</td>
                          <td className="py-3 px-6 text-right font-medium text-destructive">{formatCurrency(statement.expenses.totalExpenses)}</td>
                          <td className="py-3 px-6 text-right text-muted-foreground">
                            {formatPercentage(statement.expenses.totalExpenses, statement.revenue.totalRevenue)}%
                          </td>
                        </tr>
                      )}

                      <tr className="bg-destructive/5 border-t-2 border-destructive/20">
                        <td className="py-4 px-6 font-bold text-destructive">Total Expenses</td>
                        <td className="py-4 px-6 text-right font-bold text-destructive text-base">{formatCurrency(statement.expenses.totalExpenses)}</td>
                        <td className="py-4 px-6 text-right font-bold text-destructive">
                          {formatPercentage(statement.expenses.totalExpenses, statement.revenue.totalRevenue)}%
                        </td>
                      </tr>

                      {/* Net Income */}
                      <tr className={`border-t-4 ${statement.netIncome >= 0 ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
                        <td className="py-6 px-6 font-bold text-lg">
                          <span className={getTrendColor(statement.netIncome)}>NET INCOME</span>
                        </td>
                        <td className="py-6 px-6 text-right font-bold text-xl">
                          <span className={getTrendColor(statement.netIncome)}>{formatCurrency(statement.netIncome)}</span>
                        </td>
                        <td className="py-6 px-6 text-right font-bold text-base">
                          <span className={getTrendColor(statement.netIncome)}>
                            {formatPercentage(Math.abs(statement.netIncome), statement.revenue.totalRevenue)}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Breakdown (only when category data is available) */}
            {Object.keys(statement.revenue.incomesByCategory).length > 0 && (
              <Card className="border-border/40 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-primary" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statement.revenue.incomesByCategory).map(([cat, amount]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{cat}</span>
                          <span className="font-medium text-foreground">
                            {formatPercentage(amount, statement.revenue.totalRevenue)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-2">
                          <div
                            className="bg-success/60 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${formatPercentage(amount, statement.revenue.totalRevenue)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default IncomeStatementPage;
