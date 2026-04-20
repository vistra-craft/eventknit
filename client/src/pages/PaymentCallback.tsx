import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import CheckoutHeader from "@/components/layout/CheckoutHeader";
import { verifyPayment } from "@/lib/payment-api";

/**
 * PaymentCallback — Handles Paystack redirect after payment
 *
 * Paystack redirects here with:
 *   ?reference=EVT-...&trxref=EVT-...&gateway=PAYSTACK
 *
 * This page verifies the payment and redirects to /confirmation with full
 * state so the Confirmation page can render order details.
 */
const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const gateway = searchParams.get("gateway") || "PAYSTACK";

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setErrorMessage("No payment reference found. Please contact support.");
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyPayment(reference);

        if (result.success && result.data?.success) {
          setStatus("success");

          // Extract event/order details from the verification metadata
          // These were passed as metadata during payment initialization
          const meta = result.data.metadata as Record<string, unknown> | undefined;
          const eventTitle = (meta?.eventTitle as string) || "Your Event";
          const eventId = (meta?.eventId as string) || "";

          setTimeout(() => {
            navigate("/confirmation", {
              state: {
                eventId,
                eventTitle,
                tickets: [],           // Webhook will have confirmed the registration; email has full breakdown
                totalPrice: result.data.amount,
                paymentMethod: gateway.toLowerCase(),
                paymentId: reference,
                date: new Date().toISOString(),
                isFreeEvent: false,
                success: true,
              },
              replace: true,
            });
          }, 1500);
        } else {
          setStatus("failed");
          setErrorMessage(
            result.data?.status === "ALREADY_PAID"
              ? "This payment has already been completed. Check your email for your ticket."
              : "Payment verification failed. If you were charged, please contact support."
          );
        }
      } catch (err: unknown) {
        setStatus("failed");
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Failed to verify payment. Please contact support.";
        setErrorMessage(msg);
      }
    };

    verify();
  }, [reference, gateway, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />

      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
        {status === "verifying" && (
          <>
            <Loader size="lg" />
            <p className="text-lg font-semibold">Verifying your payment…</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your transaction with {gateway}.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-2xl font-bold text-green-600">Payment Successful!</p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to your confirmation…
            </p>
            <Loader size="sm" />
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <p className="text-2xl font-bold text-destructive">Payment Issue</p>
            <p className="text-sm text-muted-foreground max-w-sm text-center">
              {errorMessage}
            </p>
            {reference && (
              <p className="text-xs text-muted-foreground">
                Reference: <span className="font-mono">{reference}</span>
              </p>
            )}
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => navigate(-2)}>
                Go Back
              </Button>
              <Button onClick={() => navigate("/support")}>
                Contact Support
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
