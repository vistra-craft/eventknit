import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { createWage, updateWage, getWageById } from "@/lib/platform-finance-api";

const EditWagePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    position: "",
    department: "",
    amount: "",
    payPeriod: "",
    payDate: "",
    status: "pending",
    paymentMethod: "bank_transfer",
    hoursWorked: "",
    hourlyRate: "",
    overtime: "",
    deductions: "",
    bonuses: "",
    notes: ""
  });

  const fetchWage = useCallback(async (wageId: string) => {
    try {
      setLoading(true);
      const response = await getWageById(wageId);
      if (response.success && response.data) {
        const wage = response.data;
        setFormData({
          employeeName: wage.employeeName || "",
          employeeId: wage.employeeId || "",
          position: wage.position || "",
          department: wage.department || "",
          amount: wage.amount || "",
          payPeriod: wage.payPeriod || "",
          payDate: wage.payDate ? wage.payDate.split("T")[0] : "",
          status: wage.status || "pending",
          paymentMethod: wage.paymentMethod || "bank_transfer",
          hoursWorked: "",
          hourlyRate: "",
          overtime: "",
          deductions: "",
          bonuses: "",
          notes: wage.notes || ""
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to load wage details",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isEditing && id) {
      fetchWage(id);
    }
  }, [id, isEditing, fetchWage]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.employeeName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Employee name is required",
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Valid amount is required",
      });
      return;
    }

    if (!formData.payPeriod.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Pay period is required",
      });
      return;
    }

    if (!formData.payDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Pay date is required",
      });
      return;
    }

    try {
      setSaving(true);
      const wageData = {
        employeeName: formData.employeeName,
        employeeId: formData.employeeId || undefined,
        position: formData.position || undefined,
        department: formData.department || undefined,
        amount: parseFloat(formData.amount),
        payPeriod: formData.payPeriod,
        payDate: formData.payDate,
        status: formData.status,
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes || undefined,
      };

      if (isEditing && id) {
        await updateWage(id, wageData);
        toast({
          title: "Success",
          description: "Wage updated successfully",
        });
      } else {
        await createWage(wageData);
        toast({
          title: "Success",
          description: "Wage created successfully",
        });
      }
      navigate("/admin/finance/wages");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} wage`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/finance/wages");
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/finance/wages" label="Back" />
            <div>
              <h1 className="text-base font-semibold text-foreground">{isEditing ? "Edit Wage" : "Add Wage"}</h1>
              <p className="text-muted-foreground">{isEditing ? "Update wage details" : "Add a new wage payment"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Employee Information</CardTitle>
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
              <CardTitle className="text-base font-semibold text-foreground">Payment Information</CardTitle>
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
              <CardTitle className="text-base font-semibold text-foreground">Work Details</CardTitle>
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
              <CardTitle className="text-base font-semibold text-foreground">Adjustments</CardTitle>
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
  );
};

export default EditWagePage;
