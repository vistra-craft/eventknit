import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

export const RefundPolicy = () => {
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
};
