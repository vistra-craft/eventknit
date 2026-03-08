import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPaymentTransaction, type PaymentTransaction } from "@/lib/financial-api";
import { useToast } from "@/hooks/useToast";

const PaymentTransactionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const response = await getPaymentTransaction(id);
        if (response.success && response.data) {
          setTransaction(response.data);
        } else {
          toast({
            title: "Not Found",
            description: "Payment transaction not found",
            variant: "destructive",
          });
          navigate("/admin/finance/payments");
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load transaction details",
          variant: "destructive",
        });
        navigate("/admin/finance/payments");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, toast]);

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string): { className: string; icon: React.ReactNode } => {
    const configs: Record<string, { className: string; icon: React.ReactNode }> = {
      success: {
        className: "bg-success/10 text-success border-success/20",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      pending: {
        className: "bg-warning/10 text-warning border-warning/20",
        icon: <Clock className="h-4 w-4" />,
      },
      failed: {
        className: "bg-destructive/10 text-destructive border-destructive/20",
        icon: <XCircle className="h-4 w-4" />,
      },
      cancelled: {
        className: "bg-muted text-muted-foreground border-border",
        icon: <AlertCircle className="h-4 w-4" />,
      },
    };
    return configs[status] ?? {
      className: "bg-muted text-muted-foreground border-border",
      icon: <AlertCircle className="h-4 w-4" />,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/finance/payments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-16 text-muted-foreground">Loading transaction...</div>
      </div>
    );
  }

  if (!transaction) return null;

  const statusConfig = getStatusConfig(transaction.paymentStatus);
  const platformFee = transaction.platformFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/finance/payments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Transaction {transaction.transactionNumber}
            </h1>
            <p className="text-sm text-muted-foreground">Payment transaction details</p>
          </div>
        </div>
        <Badge className={statusConfig.className}>
          <span className="flex items-center gap-1">
            {statusConfig.icon}
            {transaction.paymentStatus}
          </span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendee */}
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Attendee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Name" value={transaction.attendeeName ?? "N/A"} />
              <DetailRow label="Email" value={transaction.attendeeEmail} />
            </CardContent>
          </Card>

          {/* Event */}
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Event" value={transaction.event?.title ?? "N/A"} />
              <DetailRow
                label="Organizer"
                value={transaction.event?.organizer.organizationName ?? "N/A"}
              />
              <DetailRow label="Event ID" value={transaction.eventId} mono />
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Transaction #" value={transaction.transactionNumber} mono />
              <DetailRow label="Paystack Reference" value={transaction.paystackReference} mono />
              <DetailRow label="Payment Method" value={transaction.paymentMethod} />
              <DetailRow label="Payment Date" value={formatDate(transaction.paymentDate)} />
              <DetailRow label="Registration ID" value={transaction.registrationId} mono />
            </CardContent>
          </Card>
        </div>

        {/* Right column — amounts */}
        <div className="space-y-6">
          {/* Amount breakdown */}
          <Card className="border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Amount Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Gross (Paystack)</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(transaction.paystackAmount, transaction.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">System Amount</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
              {platformFee ? (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Platform Fee</span>
                    <span className="font-semibold text-destructive">
                      − {formatCurrency(platformFee.feeAmount, transaction.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Organizer Payout</span>
                    <span className="font-semibold text-success">
                      {formatCurrency(platformFee.organizerAmount, transaction.currency)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  No platform fee record found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform fee status */}
          {platformFee && (
            <Card className="border-border/40 bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-foreground">Platform Fee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Fee ID" value={platformFee.id} mono />
                <DetailRow
                  label="Status"
                  value={
                    <Badge className={getStatusConfig(platformFee.status).className}>
                      <span className="flex items-center gap-1">
                        {getStatusConfig(platformFee.status).icon}
                        {platformFee.status}
                      </span>
                    </Badge>
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* No platform fee? show expected split */}
          {!platformFee && transaction.paymentStatus === "success" && (
            <Card className="border-border/40 bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-foreground text-warning">
                  Missing Platform Fee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This transaction has no associated platform fee record. Run a reconciliation to
                  detect and fix discrepancies.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

const DetailRow = ({ label, value, mono }: DetailRowProps) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className={`text-sm text-foreground text-right break-all ${mono ? "font-mono" : ""}`}>
      {value}
    </span>
  </div>
);

export default PaymentTransactionDetailPage;
