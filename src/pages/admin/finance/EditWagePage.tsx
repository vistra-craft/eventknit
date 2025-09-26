import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "../AdminLayout";

const EditWagePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    position: "",
    department: "",
    amount: "",
    payPeriod: "",
    payDate: "",
    status: "paid",
    paymentMethod: "bank_transfer",
    hoursWorked: "",
    hourlyRate: "",
    overtime: "",
    deductions: "",
    bonuses: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    console.log("Saving wage:", formData);
    // TODO: Implement save logic
    navigate("/admin/finance/wages");
  };

  const handleCancel = () => {
    navigate("/admin/finance/wages");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Wage</h1>
              <p className="text-gray-600">Update wage details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange("employeeId", e.target.value)}
                    placeholder="EMP-001"
                  />
                </div>
                <div>
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input
                    id="employeeName"
                    value={formData.employeeName}
                    onChange={(e) => handleInputChange("employeeName", e.target.value)}
                    placeholder="Employee name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                    placeholder="Job position"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="payDate">Pay Date</Label>
                  <Input
                    id="payDate"
                    type="date"
                    value={formData.payDate}
                    onChange={(e) => handleInputChange("payDate", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="payPeriod">Pay Period</Label>
                <Input
                  id="payPeriod"
                  value={formData.payPeriod}
                  onChange={(e) => handleInputChange("payPeriod", e.target.value)}
                  placeholder="2024-01-01 to 2024-01-31"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Details */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Work Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    value={formData.hoursWorked}
                    onChange={(e) => handleInputChange("hoursWorked", e.target.value)}
                    placeholder="160"
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                    placeholder="25.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="overtime">Overtime Hours</Label>
                <Input
                  id="overtime"
                  type="number"
                  value={formData.overtime}
                  onChange={(e) => handleInputChange("overtime", e.target.value)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Adjustments */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bonuses">Bonuses</Label>
                  <Input
                    id="bonuses"
                    type="number"
                    value={formData.bonuses}
                    onChange={(e) => handleInputChange("bonuses", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="deductions">Deductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => handleInputChange("deductions", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes about this wage payment"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditWagePage;
