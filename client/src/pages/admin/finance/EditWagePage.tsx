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
import { createWage, updateWage, getWageById, type StaffPayType } from "@/lib/platform-finance-api";
import { showErrorToast } from "@/lib/utils/error";

const EditWagePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditing = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    position: "",
    department: "",
    staffType: "PERMANENT" as StaffPayType,
    grossAmount: "",
    amount: "",
    payPeriod: "",
    payDate: "",
    status: "PENDING",
    paymentMethod: "BANK_TRANSFER",
    hoursWorked: "",
    hourlyRate: "",
    overtimeHours: "",
    overtimeRate: "",
    dailyRate: "",
    eventDays: "",
    deductions: "",
    bonuses: "",
    eventId: "",
    reference: "",
    notes: "",
  });

  const fetchWage = useCallback(async (wageId: string) => {
    try {
      setLoading(true);
      const response = await getWageById(wageId);
      if (response.success && response.data) {
        const w = response.data;
        setFormData({
          employeeName: w.employeeName || "",
          employeeId: w.employeeId || "",
          position: w.position || "",
          department: w.department || "",
          staffType: w.staffType || "PERMANENT",
          grossAmount: w.grossAmount || "",
          amount: w.amount || "",
          payPeriod: w.payPeriod || "",
          payDate: w.payDate ? w.payDate.split("T")[0] : "",
          status: w.status || "PENDING",
          paymentMethod: w.paymentMethod || "BANK_TRANSFER",
          hoursWorked: w.hoursWorked || "",
          hourlyRate: w.hourlyRate || "",
          overtimeHours: w.overtimeHours || "",
          overtimeRate: w.overtimeRate || "",
          dailyRate: w.dailyRate || "",
          eventDays: w.eventDays?.toString() || "",
          deductions: w.deductions || "",
          bonuses: w.bonuses || "",
          eventId: w.eventId || "",
          reference: w.reference || "",
          notes: w.notes || "",
        });
      }
    } catch (error: unknown) {
      showErrorToast(toast, error, "Failed to load wage details");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isEditing && id) fetchWage(id);
  }, [id, isEditing, fetchWage]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-calculate net pay when relevant fields change
  const { staffType, dailyRate, eventDays, hoursWorked, hourlyRate, overtimeHours, overtimeRate, bonuses, deductions } = formData;
  useEffect(() => {
    let gross = 0;
    if (staffType === 'EVENT' && dailyRate && eventDays) {
      gross = parseFloat(dailyRate) * parseInt(eventDays);
    } else if (hoursWorked && hourlyRate) {
      gross = parseFloat(hoursWorked) * parseFloat(hourlyRate);
      if (overtimeHours && overtimeRate) {
        gross += parseFloat(overtimeHours) * parseFloat(overtimeRate);
      }
    } else {
      return; // Don't auto-calculate if no rate-based fields
    }

    const b = bonuses ? parseFloat(bonuses) : 0;
    const d = deductions ? parseFloat(deductions) : 0;
    const net = gross + b - d;

    setFormData(prev => ({
      ...prev,
      grossAmount: gross.toFixed(2),
      amount: Math.max(0, net).toFixed(2),
    }));
  }, [staffType, dailyRate, eventDays, hoursWorked, hourlyRate, overtimeHours, overtimeRate, bonuses, deductions]);

  const handleSave = async () => {
    if (!formData.employeeName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Employee name is required" });
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Valid amount is required" });
      return;
    }
    if (!formData.payPeriod.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Pay period is required" });
      return;
    }
    if (!formData.payDate) {
      toast({ variant: "destructive", title: "Validation Error", description: "Pay date is required" });
      return;
    }

    try {
      setSaving(true);
      const wageData = {
        employeeName: formData.employeeName,
        employeeId: formData.employeeId || undefined,
        position: formData.position || undefined,
        department: formData.department || undefined,
        staffType: formData.staffType,
        grossAmount: formData.grossAmount ? parseFloat(formData.grossAmount) : parseFloat(formData.amount),
        amount: parseFloat(formData.amount),
        hoursWorked: formData.hoursWorked ? parseFloat(formData.hoursWorked) : undefined,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        overtimeHours: formData.overtimeHours ? parseFloat(formData.overtimeHours) : undefined,
        overtimeRate: formData.overtimeRate ? parseFloat(formData.overtimeRate) : undefined,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
        eventDays: formData.eventDays ? parseInt(formData.eventDays) : undefined,
        bonuses: formData.bonuses ? parseFloat(formData.bonuses) : undefined,
        deductions: formData.deductions ? parseFloat(formData.deductions) : undefined,
        payPeriod: formData.payPeriod,
        payDate: formData.payDate,
        paymentMethod: formData.paymentMethod || undefined,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        eventId: formData.eventId || undefined,
        status: formData.status,
      };

      if (isEditing && id) {
        await updateWage(id, wageData);
        toast({ title: "Success", description: "Wage updated successfully" });
      } else {
        await createWage(wageData);
        toast({ title: "Success", description: "Wage created successfully" });
      }
      navigate("/admin/finance/wages");
    } catch (error: unknown) {
      showErrorToast(toast, error, `Failed to ${isEditing ? "update" : "create"} wage`);
    } finally {
      setSaving(false);
    }
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
          <Button variant="outline" onClick={() => navigate("/admin/finance/wages")} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Information */}
        <Card className="border-border/40 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" value={formData.employeeId} onChange={(e) => handleInputChange("employeeId", e.target.value)} placeholder="EMP-001" />
              </div>
              <div>
                <Label htmlFor="employeeName">Employee Name *</Label>
                <Input id="employeeName" value={formData.employeeName} onChange={(e) => handleInputChange("employeeName", e.target.value)} placeholder="Employee name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={formData.position} onChange={(e) => handleInputChange("position", e.target.value)} placeholder="Job position" />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Event Staff">Event Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="staffType">Staff Type *</Label>
              <Select value={formData.staffType} onValueChange={(value) => handleInputChange("staffType", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent (Monthly Salary)</SelectItem>
                  <SelectItem value="CONTRACT">Contract (Fixed-Term)</SelectItem>
                  <SelectItem value="EVENT">Event-Based (Daily Rate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="border-border/40 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grossAmount">Gross Amount</Label>
                <Input id="grossAmount" type="number" value={formData.grossAmount} onChange={(e) => handleInputChange("grossAmount", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="amount">Net Pay (Amount) *</Label>
                <Input id="amount" type="number" value={formData.amount} onChange={(e) => handleInputChange("amount", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payPeriod">Pay Period *</Label>
                <Input id="payPeriod" value={formData.payPeriod} onChange={(e) => handleInputChange("payPeriod", e.target.value)} placeholder="March 2025" />
              </div>
              <div>
                <Label htmlFor="payDate">Pay Date *</Label>
                <Input id="payDate" type="date" value={formData.payDate} onChange={(e) => handleInputChange("payDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="MPESA">M-Pesa</SelectItem>
                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reference">Payment Reference</Label>
              <Input id="reference" value={formData.reference} onChange={(e) => handleInputChange("reference", e.target.value)} placeholder="Transaction reference" />
            </div>
          </CardContent>
        </Card>

        {/* Work Details — shown for hourly/contract staff */}
        {(formData.staffType === 'PERMANENT' || formData.staffType === 'CONTRACT') && (
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Work Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input id="hoursWorked" type="number" value={formData.hoursWorked} onChange={(e) => handleInputChange("hoursWorked", e.target.value)} placeholder="160" />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input id="hourlyRate" type="number" value={formData.hourlyRate} onChange={(e) => handleInputChange("hourlyRate", e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="overtimeHours">Overtime Hours</Label>
                  <Input id="overtimeHours" type="number" value={formData.overtimeHours} onChange={(e) => handleInputChange("overtimeHours", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="overtimeRate">Overtime Rate (per hour)</Label>
                  <Input id="overtimeRate" type="number" value={formData.overtimeRate} onChange={(e) => handleInputChange("overtimeRate", e.target.value)} placeholder="0.00" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Details — shown for event-based staff */}
        {formData.staffType === 'EVENT' && (
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dailyRate">Daily Rate</Label>
                  <Input id="dailyRate" type="number" value={formData.dailyRate} onChange={(e) => handleInputChange("dailyRate", e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="eventDays">Event Days</Label>
                  <Input id="eventDays" type="number" value={formData.eventDays} onChange={(e) => handleInputChange("eventDays", e.target.value)} placeholder="1" />
                </div>
              </div>
              <div>
                <Label htmlFor="eventId">Event ID (optional)</Label>
                <Input id="eventId" value={formData.eventId} onChange={(e) => handleInputChange("eventId", e.target.value)} placeholder="Paste event ID to link this wage to an event" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Adjustments */}
        <Card className="border-border/40 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Adjustments & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bonuses">Bonuses</Label>
                <Input id="bonuses" type="number" value={formData.bonuses} onChange={(e) => handleInputChange("bonuses", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="deductions">Deductions</Label>
                <Input id="deductions" type="number" value={formData.deductions} onChange={(e) => handleInputChange("deductions", e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} placeholder="Additional notes" rows={4} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditWagePage;
