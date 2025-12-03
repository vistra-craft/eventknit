import { Card } from "@/components/ui/card";
import { Shield, Clock, RefreshCcw } from "lucide-react";

export const RefundPolicy = () => {
  return (
    <Card className="p-6 rounded-2xl border-0 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Refund Policy</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">Free Cancellation</h4>
            <p className="text-sm text-muted-foreground">
              Cancel up to 24 hours before the event for a full refund
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <RefreshCcw className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">Easy Transfer</h4>
            <p className="text-sm text-muted-foreground">
              Transfer tickets to friends if you can't make it
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">Event Cancellation</h4>
            <p className="text-sm text-muted-foreground">
              Full refund if the event is cancelled by the organizer
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Refunds are processed within 5-7 business days. Service fees may be non-refundable 
          depending on the cancellation timing.
        </p>
      </div>
    </Card>
  );
};
