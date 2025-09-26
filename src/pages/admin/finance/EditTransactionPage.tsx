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

const EditTransactionPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "income",
    category: "",
    description: "",
    amount: "",
    date: "",
    source: "",
    recipient: "",
    status: "completed",
    paymentMethod: "bank_transfer",
    reference: "",
    eventId: "",
    eventName: "",
    attendeeId: "",
    attendeeName: "",
    organizerId: "",
    organizerName: "",
    ticketType: "",
    ticketQuantity: "",
    platformFee: "",
    organizerAmount: "",
    transactionType: "other"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    console.log("Saving transaction:", formData);
    // TODO: Implement save logic
    navigate("/admin/finance/transactions");
  };

  const handleCancel = () => {
    navigate("/admin/finance/transactions");
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Transaction</h1>
              <p className="text-gray-600">Update transaction details</p>
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
          {/* Basic Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ticket Sales">Ticket Sales</SelectItem>
                      <SelectItem value="Organizer Payments">Organizer Payments</SelectItem>
                      <SelectItem value="Platform Fees">Platform Fees</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Wages">Wages</SelectItem>
                      <SelectItem value="Subscription">Subscription</SelectItem>
                      <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter transaction description"
                />
              </div>

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
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
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
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange("reference", e.target.value)}
                  placeholder="Transaction reference"
                />
              </div>
            </CardContent>
          </Card>

          {/* Event & Party Information */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Event & Party Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={formData.transactionType} onValueChange={(value) => handleInputChange("transactionType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ticket_purchase">Ticket Purchase</SelectItem>
                    <SelectItem value="organizer_payment">Organizer Payment</SelectItem>
                    <SelectItem value="platform_fee">Platform Fee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventId">Event ID</Label>
                  <Input
                    id="eventId"
                    value={formData.eventId}
                    onChange={(e) => handleInputChange("eventId", e.target.value)}
                    placeholder="EVT-001"
                  />
                </div>
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    value={formData.eventName}
                    onChange={(e) => handleInputChange("eventName", e.target.value)}
                    placeholder="Event name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attendeeId">Attendee ID</Label>
                  <Input
                    id="attendeeId"
                    value={formData.attendeeId}
                    onChange={(e) => handleInputChange("attendeeId", e.target.value)}
                    placeholder="ATT-001"
                  />
                </div>
                <div>
                  <Label htmlFor="attendeeName">Attendee Name</Label>
                  <Input
                    id="attendeeName"
                    value={formData.attendeeName}
                    onChange={(e) => handleInputChange("attendeeName", e.target.value)}
                    placeholder="Attendee name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizerId">Organizer ID</Label>
                  <Input
                    id="organizerId"
                    value={formData.organizerId}
                    onChange={(e) => handleInputChange("organizerId", e.target.value)}
                    placeholder="ORG-001"
                  />
                </div>
                <div>
                  <Label htmlFor="organizerName">Organizer Name</Label>
                  <Input
                    id="organizerName"
                    value={formData.organizerName}
                    onChange={(e) => handleInputChange("organizerName", e.target.value)}
                    placeholder="Organizer name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticketType">Ticket Type</Label>
                  <Input
                    id="ticketType"
                    value={formData.ticketType}
                    onChange={(e) => handleInputChange("ticketType", e.target.value)}
                    placeholder="VIP, General, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="ticketQuantity">Ticket Quantity</Label>
                  <Input
                    id="ticketQuantity"
                    type="number"
                    value={formData.ticketQuantity}
                    onChange={(e) => handleInputChange("ticketQuantity", e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platformFee">Platform Fee</Label>
                  <Input
                    id="platformFee"
                    type="number"
                    value={formData.platformFee}
                    onChange={(e) => handleInputChange("platformFee", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="organizerAmount">Organizer Amount</Label>
                  <Input
                    id="organizerAmount"
                    type="number"
                    value={formData.organizerAmount}
                    onChange={(e) => handleInputChange("organizerAmount", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => handleInputChange("source", e.target.value)}
                    placeholder="Income source"
                  />
                </div>
                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange("recipient", e.target.value)}
                    placeholder="Expense recipient"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditTransactionPage;
