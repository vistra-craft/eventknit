import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search, Eye, Edit, Trash2, Calendar, User, DollarSign, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "../AdminLayout";

interface Wage {
  id: string;
  employeeName: string;
  employeeId: string;
  position: string;
  department: string;
  amount: number;
  payPeriod: string;
  payDate: string;
  status: "paid" | "pending" | "cancelled";
  paymentMethod: "bank_transfer" | "check" | "cash";
  hoursWorked?: number;
  hourlyRate?: number;
  overtime?: number;
  deductions?: number;
  bonuses?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const mockWages: Wage[] = [
  {
    id: "1",
    employeeName: "John Smith",
    employeeId: "EMP001",
    position: "Senior Developer",
    department: "Development",
    amount: 7500,
    payPeriod: "2024-01-01 to 2024-01-31",
    payDate: "2024-01-31",
    status: "paid",
    paymentMethod: "bank_transfer",
    hoursWorked: 160,
    hourlyRate: 46.88,
    overtime: 0,
    deductions: 1200,
    bonuses: 500,
    notes: "Regular monthly salary with performance bonus",
    createdBy: "admin_001",
    createdAt: "2024-01-31 09:00:00"
  },
  {
    id: "2",
    employeeName: "Sarah Johnson",
    employeeId: "EMP002",
    position: "Marketing Manager",
    department: "Marketing",
    amount: 6500,
    payPeriod: "2024-01-01 to 2024-01-31",
    payDate: "2024-01-31",
    status: "paid",
    paymentMethod: "bank_transfer",
    hoursWorked: 160,
    hourlyRate: 40.63,
    overtime: 0,
    deductions: 1000,
    bonuses: 0,
    notes: "Regular monthly salary",
    createdBy: "admin_001",
    createdAt: "2024-01-31 09:00:00"
  },
  {
    id: "3",
    employeeName: "Mike Wilson",
    employeeId: "EMP003",
    position: "UI/UX Designer",
    department: "Design",
    amount: 5500,
    payPeriod: "2024-01-01 to 2024-01-31",
    payDate: "2024-01-31",
    status: "paid",
    paymentMethod: "bank_transfer",
    hoursWorked: 160,
    hourlyRate: 34.38,
    overtime: 0,
    deductions: 850,
    bonuses: 200,
    notes: "Regular monthly salary with design bonus",
    createdBy: "admin_001",
    createdAt: "2024-01-31 09:00:00"
  },
  {
    id: "4",
    employeeName: "Emily Davis",
    employeeId: "EMP004",
    position: "Content Writer",
    department: "Marketing",
    amount: 4000,
    payPeriod: "2024-01-01 to 2024-01-31",
    payDate: "2024-01-31",
    status: "pending",
    paymentMethod: "bank_transfer",
    hoursWorked: 160,
    hourlyRate: 25.00,
    overtime: 0,
    deductions: 600,
    bonuses: 0,
    notes: "Regular monthly salary",
    createdBy: "admin_001",
    createdAt: "2024-01-31 09:00:00"
  },
  {
    id: "5",
    employeeName: "David Brown",
    employeeId: "EMP005",
    position: "Part-time Developer",
    department: "Development",
    amount: 2400,
    payPeriod: "2024-01-01 to 2024-01-31",
    payDate: "2024-01-31",
    status: "paid",
    paymentMethod: "bank_transfer",
    hoursWorked: 80,
    hourlyRate: 30.00,
    overtime: 0,
    deductions: 360,
    bonuses: 0,
    notes: "Part-time monthly salary",
    createdBy: "admin_001",
    createdAt: "2024-01-31 09:00:00"
  },
  {
    id: "6",
    employeeName: "Lisa Anderson",
    employeeId: "EMP006",
    position: "Customer Support",
    department: "Support",
    amount: 3500,
    payPeriod: "2024-01-01 to 2024-01-31",
    payDate: "2024-01-31",
    status: "paid",
    paymentMethod: "bank_transfer",
    hoursWorked: 160,
    hourlyRate: 21.88,
    overtime: 0,
    deductions: 525,
    bonuses: 0,
    notes: "Regular monthly salary",
    createdBy: "admin_001",
    createdAt: "2024-01-31 09:00:00"
  }
];

const WagesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedWage, setSelectedWage] = useState<Wage | null>(null);

  const filteredWages = mockWages.filter(wage => {
    const matchesSearch = wage.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wage.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wage.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || wage.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || wage.status === statusFilter;
    const matchesPosition = positionFilter === "all" || wage.position === positionFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesPosition;
  });

  const totalWages = mockWages
    .filter(w => w.status === "paid")
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWages = mockWages
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      bank_transfer: "bg-blue-100 text-blue-800 border-blue-200",
      check: "bg-orange-100 text-orange-800 border-orange-200",
      cash: "bg-gray-100 text-gray-800 border-gray-200"
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

  const handleAddWage = () => {
    console.log("Adding new wage");
    // TODO: Implement add wage logic
  };

  const handleViewWage = (wage: Wage) => {
    setSelectedWage(wage);
    setShowViewModal(true);
  };

  const handleEditWage = (id: string) => {
    navigate(`/admin/finance/wages/edit/${id}`);
  };

  const handleDeleteWage = (id: string) => {
    if (window.confirm("Are you sure you want to delete this wage record? This action cannot be undone.")) {
      console.log("Deleting wage:", id);
      // TODO: Implement delete wage logic
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wage Management</h1>
            <p className="text-gray-600">Track and manage employee wages and payroll</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Payroll Report
            </Button>
            <Button size="sm" onClick={handleAddWage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Wage
            </Button>
          </div>
        </div>

        {/* Wage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {formatCurrency(totalWages)}
              </div>
              <p className="text-sm text-gray-600">Total Wages Paid</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {formatCurrency(pendingWages)}
              </div>
              <p className="text-sm text-gray-600">Pending Payments</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-600 mb-2">
                {mockWages.length}
              </div>
              <p className="text-sm text-gray-600">Total Employees</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {formatCurrency(mockWages.reduce((sum, w) => sum + (w.amount / (w.hoursWorked || 1)), 0) / mockWages.length)}
              </div>
              <p className="text-sm text-gray-600">Avg Hourly Rate</p>
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
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="Senior Developer">Senior Developer</SelectItem>
                  <SelectItem value="Marketing Manager">Marketing Manager</SelectItem>
                  <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                  <SelectItem value="Content Writer">Content Writer</SelectItem>
                  <SelectItem value="Part-time Developer">Part-time Developer</SelectItem>
                  <SelectItem value="Customer Support">Customer Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Wages List */}
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
                      <h3 className="font-semibold text-gray-900">{wage.employeeName}</h3>
                      <Badge className={`text-xs ${getStatusBadge(wage.status)}`}>
                        {wage.status}
                      </Badge>
                      <Badge className={`text-xs ${getPaymentMethodBadge(wage.paymentMethod)}`}>
                        {wage.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{wage.position}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>ID: {wage.employeeId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Dept: {wage.department}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(wage.payDate)}</span>
                      </div>
                      {wage.hoursWorked && (
                        <div className="flex items-center gap-1">
                          <span>{wage.hoursWorked}h @ {formatCurrency(wage.hourlyRate || 0)}/h</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span>Period: {wage.payPeriod}</span>
                      {wage.bonuses && wage.bonuses > 0 && (
                        <span className="ml-4 text-green-600">Bonus: +{formatCurrency(wage.bonuses)}</span>
                      )}
                      {wage.deductions && wage.deductions > 0 && (
                        <span className="ml-4 text-red-600">Deductions: -{formatCurrency(wage.deductions)}</span>
                      )}
                    </div>
                    {wage.notes && (
                      <p className="text-sm text-gray-600 mb-2">{wage.notes}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created by {wage.createdBy} on {formatDate(wage.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">
                        -{formatCurrency(wage.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewWage(wage)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditWage(wage.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteWage(wage.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWages.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No wage records found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Wage Modal */}
        {showViewModal && selectedWage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-gray-900">Wage Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Wage ID</label>
                    <p className="text-sm text-gray-900">{selectedWage.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Employee ID</label>
                    <p className="text-sm text-gray-900">{selectedWage.employeeId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Employee Name</label>
                    <p className="text-sm text-gray-900">{selectedWage.employeeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Position</label>
                    <p className="text-sm text-gray-900">{selectedWage.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Department</label>
                    <p className="text-sm text-gray-900">{selectedWage.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-sm font-semibold text-red-600">-{formatCurrency(selectedWage.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`text-xs ${getStatusBadge(selectedWage.status)}`}>
                      {selectedWage.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedWage.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pay Period</label>
                    <p className="text-sm text-gray-900">{selectedWage.payPeriod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pay Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedWage.payDate)}</p>
                  </div>
                </div>

                {selectedWage.hoursWorked && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hours Worked</label>
                      <p className="text-sm text-gray-900">{selectedWage.hoursWorked} hours</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hourly Rate</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedWage.hourlyRate || 0)}/hour</p>
                    </div>
                  </div>
                )}

                {selectedWage.bonuses && selectedWage.bonuses > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bonuses</label>
                    <p className="text-sm text-green-600">+{formatCurrency(selectedWage.bonuses)}</p>
                  </div>
                )}

                {selectedWage.deductions && selectedWage.deductions > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Deductions</label>
                    <p className="text-sm text-red-600">-{formatCurrency(selectedWage.deductions)}</p>
                  </div>
                )}

                {selectedWage.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-sm text-gray-900">{selectedWage.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created By</label>
                    <p className="text-sm text-gray-900">{selectedWage.createdBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedWage.createdAt)}</p>
                  </div>
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
