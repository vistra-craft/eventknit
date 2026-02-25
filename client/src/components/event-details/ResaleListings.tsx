import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { getMarketplaceTickets } from "../../lib/user-dashboard-api";
import { useAuthContext } from "../../hooks/useAuthContext";

interface ResaleListing {
  id: string;
  originalPrice: number;
  resalePrice: number;
  currency: string;
  status: string;
  registration: {
    ticketType?: string;
    event: {
      id: string;
      title: string;
    };
  };
  seller: {
    id: string;
    firstName?: string;
  };
}

interface ResaleListingsProps {
  eventId: string;
}

const ResaleListings = ({ eventId }: ResaleListingsProps) => {
  const navigate = useNavigate();
  const { state: authState } = useAuthContext();
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await getMarketplaceTickets({ eventId, limit: 6 });
        if (response.success && response.data) {
          setListings((response.data.tickets || []) as unknown as ResaleListing[]);
        }
      } catch {
        // Silently fail — this is a supplementary section
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [eventId]);

  if (loading || listings.length === 0) return null;

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount);
  };

  const handleBuy = () => {
    if (authState.user) {
      navigate("/user/ticket-resale");
    } else {
      navigate(`/auth/sign-in?returnTo=${encodeURIComponent(`/user/ticket-resale`)}`);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Resale Tickets Available</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="flex items-center justify-between p-3 bg-card border border-border/40 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              {listing.registration.ticketType && (
                <p className="text-sm font-medium text-foreground truncate">
                  {listing.registration.ticketType}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(Number(listing.resalePrice), listing.currency)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(Number(listing.originalPrice), listing.currency)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                by {listing.seller.firstName || "Seller"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBuy()}
              className="ml-3 flex-shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Buy
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ResaleListings;
