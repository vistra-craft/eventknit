import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Ban, RotateCcw, FileText } from "lucide-react";

interface RefundPolicyProps {
  refundPolicy?: string | null;
  refundDeadlineDays?: number | null;
  refundPolicyText?: string | null;
}

export const RefundPolicy = ({ refundPolicy, refundDeadlineDays, refundPolicyText }: RefundPolicyProps) => {
  const getPolicyDetails = () => {
    switch (refundPolicy) {
      case 'full_refund':
        return {
          icon: RotateCcw,
          title: 'Full Refund Available',
          description: refundDeadlineDays && refundDeadlineDays > 0
            ? `Full refund if cancelled at least ${refundDeadlineDays} day${refundDeadlineDays !== 1 ? 's' : ''} before the event.`
            : 'Full refund available before the event starts.',
          color: 'text-success',
          bgColor: 'bg-success/10',
        };
      case 'partial_refund':
        return {
          icon: ShieldCheck,
          title: '50% Partial Refund',
          description: refundDeadlineDays && refundDeadlineDays > 0
            ? `50% refund if cancelled at least ${refundDeadlineDays} day${refundDeadlineDays !== 1 ? 's' : ''} before the event.`
            : '50% refund available before the event starts.',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-950/40',
        };
      case 'custom':
        return {
          icon: FileText,
          title: 'Refund Policy',
          description: refundPolicyText || 'Contact the organizer for refund details.',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        };
      case 'no_refunds':
        return {
          icon: Ban,
          title: 'No Refunds',
          description: 'All ticket sales are final. No refunds will be issued for this event.',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
      default:
        return null;
    }
  };

  const policy = getPolicyDetails();

  // If no policy configured, show generic fallback
  if (!policy) {
    return (
      <Card className="p-6 rounded-2xl border border-border bg-background shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold">Refund Policy</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Learn about our refund policy, cancellation terms, and ticket transfer options.
        </p>
        <Link
          to="/terms-of-service#refund-policy"
          className="text-primary hover:text-primary hover:underline font-medium text-sm transition-colors"
        >
          View Refund Policy →
        </Link>
      </Card>
    );
  }

  const Icon = policy.icon;

  return (
    <Card className="p-6 rounded-2xl border border-border bg-background shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${policy.bgColor}`}>
          <Icon className={`w-5 h-5 ${policy.color}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold mb-1">{policy.title}</h3>
          <p className="text-sm text-muted-foreground">{policy.description}</p>
          <Link
            to="/terms-of-service#refund-policy"
            className="text-primary hover:underline text-xs mt-2 inline-block"
          >
            View full terms →
          </Link>
        </div>
      </div>
    </Card>
  );
};
