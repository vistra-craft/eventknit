/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// DashboardLayout missing; use fragment wrapper instead
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import {
  getUserInvoices,
  downloadInvoice,
  generateInvoiceHTML,
} from "@/lib/invoice-api";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: string;
  totalAmount: number;
  currency: string;
  event?: {
    id: string;
    title: string;
  };
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [invoiceHTML, setInvoiceHTML] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, [activeTab]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const status = activeTab === "all" ? undefined : activeTab.toUpperCase();
      const response = await getUserInvoices({ status });
      if (response.success && response.data) {
        setInvoices(response.data.invoices || []);
      }
    } catch {
      console.error("Error loading invoices");
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const html = await generateInvoiceHTML(invoiceId);
      setInvoiceHTML(html);
      setSelectedInvoice(invoiceId);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      await downloadInvoice(invoiceId);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PAID: { variant: "default" as const, label: "Paid", icon: CheckCircle },
      SENT: { variant: "outline" as const, label: "Sent", icon: Clock },
      DRAFT: { variant: "outline" as const, label: "Draft", icon: FileText },
      OVERDUE: { variant: "destructive" as const, label: "Overdue", icon: X },
      CANCELLED: { variant: "outline" as const, label: "Cancelled", icon: X },
    };
    const config = variants[status] || { variant: "outline" as const, label: status, icon: FileText };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">My Invoices</h1>
        <p className="text-muted-foreground mt-1">
          View and download your invoices
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No invoices found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">Invoice #{invoice.invoiceNumber}</h3>
                          {getStatusBadge(invoice.status)}
                        </div>
                        {invoice.event && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {invoice.event.title}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold text-foreground">
                              {formatCurrency(invoice.totalAmount, invoice.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedInvoice && invoiceHTML && (
        <Dialog open={Boolean(selectedInvoice)} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            <div
              className="invoice-preview"
              dangerouslySetInnerHTML={{ __html: invoiceHTML }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(invoiceHTML);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
              >
                Print
              </Button>
              <Button onClick={() => handleDownloadInvoice(selectedInvoice)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Invoices;
