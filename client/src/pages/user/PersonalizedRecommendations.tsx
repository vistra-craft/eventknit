/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowRight, Sparkles } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { EventThumbnail } from "@/components/ui/event-thumbnail";
import { getPersonalizedRecommendations } from "@/lib/user-dashboard-api";
import { useNavigate } from "react-router-dom";
import { stripHtml } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import EmptyState from "@/components/EmptyState";

const PersonalizedRecommendations: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await getPersonalizedRecommendations(12);
        
        if (response.success && response.data) {
          setRecommendations(response.data.recommendations || []);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        showErrorToast(toast, error, "Failed to load recommendations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="xl" className="text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Events You Might Like</h1>
        </div>
        <p className="text-muted-foreground">
          Personalized recommendations based on your past events and interests
        </p>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No Recommendations Yet"
          description="Start attending events to get personalized recommendations based on your preferences!"
          action={{
            label: "Browse Events",
            onClick: () => navigate("/"),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((event) => (
            <Card
              key={event.id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(`/event/${event.slug ?? event.id}`)}
            >
              <div className="relative overflow-hidden">
                <EventThumbnail
                  src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"}
                  alt={event.title}
                  category={event.category || ""}
                  size="lg"
                />
                {event.category && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="bg-card/90 text-foreground">
                      {event.category}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {event.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  {event._count && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{event._count.registrations} attendees</span>
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {stripHtml(event.description)}
                  </p>
                )}

                <Button
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/event/${event.slug ?? event.id}`);
                  }}
                >
                  View Event
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;
