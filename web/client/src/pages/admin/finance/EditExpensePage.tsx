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
import AdminLayout from "../AdminLayout";
import { useToast } from "@/hooks/useToast";
import { getExpenseById, createExpense, updateExpense } from "@/lib/platform-finance-api";

const EditExpensePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    recipient: "",
    status: "COMPLETED",
    paymentMethod: "bank_transfer",
    receipt: "",
    notes: ""
  });

  const loadExpense = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await getExpenseById(id);
      const expense = response.data;
      setFormData({
        category: expense.category || "",
        description: expense.description || "",
        amount: expense.amount || "",
        date: expense.receiptDate ? expense.receiptDate.split('T')[0] : new Date().toISOString().split('T')[0],
        recipient: expense.recipient || "",
        status: expense.status || "COMPLETED",
        paymentMethod: expense.paymentMethod || "bank_transfer",
        receipt: expense.receiptUrl || "",
        notes: expense.notes || ""
      });
    } catch (saveError) {
      console.error("Error loading expense:", saveError);
      toast({
        title: "Error",
        description: "Failed to load expense",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (isEditing) {
      loadExpense();
    }
  }, [isEditing, loadExpense]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.category || !formData.description || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const data = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        recipient: formData.recipient || undefined,
        receiptUrl: formData.receipt || undefined,
        receiptDate: formData.date || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
      };

      if (isEditing && id) {
        await updateExpense(id, data);
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        await createExpense(data);
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
      }
      navigate("/admin/finance/expenses");
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/finance/expenses");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/admin/finance/expenses" label="Back" />
            <div>
              <h1 className="text-base font-semibold text-foreground">
                {isEditing ? "Edit Expense" : "New Expense"}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? "Update expense details" : "Create a new expense record"}
              </p>
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
              {isEditing ? "Save Changes" : "Create Expense"}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Wages">Wages</SelectItem>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter expense description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  value={formData.recipient}
                  onChange={(e) => handleInputChange("recipient", e.target.value)}
                  placeholder="Who received the payment"
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
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="receipt">Receipt URL</Label>
                <Input
                  id="receipt"
                  value={formData.receipt}
                  onChange={(e) => handleInputChange("receipt", e.target.value)}
                  placeholder="Receipt URL or file path"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes about this expense"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditExpensePage;
