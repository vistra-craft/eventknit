/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ThumbsUp, Plus, X, CheckCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { getUserRegisteredEvents } from "@/lib/event-api";
import { getEventReviews, createEventReview, markReviewHelpful } from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { Avatar } from "@/components/ui/avatar";

const EventReviews: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: "",
    review: "",
    pros: [] as string[],
    cons: [] as string[],
  });
  const [proInput, setProInput] = useState("");
  const [conInput, setConInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchReviews(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchUserEvents = async () => {
    try {
      setLoading(true);
      const response = await getUserRegisteredEvents({ page: 1, limit: 50 });
      if (response.success && response.data) {
        // Filter to only completed events
        const completedEvents = (response.data.events || []).filter(
          (event: any) => new Date(event.date) < new Date() || event.status === "completed"
        );
        setUserEvents(completedEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (eventId: string) => {
    try {
      const response = await getEventReviews(eventId);
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
        setAverageRating(response.data.averageRating || 0);
        setTotalReviews(response.data.totalReviews || 0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedEvent || !reviewData.rating) {
      showErrorToast(toast, null, "Please select an event and provide a rating");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createEventReview(selectedEvent.id, {
        rating: reviewData.rating,
        title: reviewData.title,
        review: reviewData.review,
        pros: reviewData.pros,
        cons: reviewData.cons,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Review submitted successfully!",
        });
        setReviewData({
          rating: 5,
          title: "",
          review: "",
          pros: [],
          cons: [],
        });
        fetchReviews(selectedEvent.id);
      }
    } catch (error: any) {
      showErrorToast(toast, error, "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
      fetchReviews(selectedEvent.id);
      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error("Error marking review helpful:", error);
    }
  };

  const addPro = () => {
    if (proInput.trim()) {
      setReviewData({
        ...reviewData,
        pros: [...reviewData.pros, proInput.trim()],
      });
      setProInput("");
    }
  };

  const addCon = () => {
    if (conInput.trim()) {
      setReviewData({
        ...reviewData,
        cons: [...reviewData.cons, conInput.trim()],
      });
      setConInput("");
    }
  };

  const removePro = (index: number) => {
    setReviewData({
      ...reviewData,
      pros: reviewData.pros.filter((_, i) => i !== index),
    });
  };

  const removeCon = (index: number) => {
    setReviewData({
      ...reviewData,
      cons: reviewData.cons.filter((_, i) => i !== index),
    });
  };

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-warning text-warning"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

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
        <h1 className="text-2xl font-bold text-foreground mb-2">Event Reviews & Ratings</h1>
        <p className="text-muted-foreground">
          Share your experience and read reviews from other attendees
        </p>
      </div>

      <Tabs defaultValue="write" className="space-y-6">
        <TabsList>
          <TabsTrigger value="write">Write a Review</TabsTrigger>
          <TabsTrigger value="browse">Browse Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="space-y-6">
          {userEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  You haven't attended any events yet. Reviews can be written after attending events.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userEvents.map((event) => (
                    <Button
                      key={event.id}
                      variant={selectedEvent?.id === event.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {selectedEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Write Your Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      {renderStars(reviewData.rating, true, (rating) =>
                        setReviewData({ ...reviewData, rating })
                      )}
                    </div>

                    <div>
                      <Label htmlFor="title">Review Title</Label>
                      <input
                        id="title"
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-lg"
                        placeholder="Brief summary of your experience"
                        value={reviewData.title}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, title: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="review">Your Review</Label>
                      <Textarea
                        id="review"
                        placeholder="Share your experience..."
                        value={reviewData.review}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, review: e.target.value })
                        }
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>Pros</Label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-border rounded-lg"
                          placeholder="Add a pro..."
                          value={proInput}
                          onChange={(e) => setProInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addPro()}
                        />
                        <Button onClick={addPro} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reviewData.pros.map((pro, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {pro}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removePro(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Cons</Label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-border rounded-lg"
                          placeholder="Add a con..."
                          value={conInput}
                          onChange={(e) => setConInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addCon()}
                        />
                        <Button onClick={addCon} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reviewData.cons.map((con, index) => (
                          <Badge key={index} variant="destructive" className="flex items-center gap-1">
                            {con}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeCon(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSubmitReview}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-6">
          {selectedEvent ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{selectedEvent.title}</h2>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {renderStars(Math.round(averageRating))}
                          <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Change Event
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No reviews yet for this event</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar
                            name={review.user?.firstName || review.user?.email || "User"}
                            size="md"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {review.user?.firstName} {review.user?.lastName || ""}
                                </p>
                                {review.isVerifiedAttendee && (
                                  <Badge variant="secondary" className="mt-1">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified Attendee
                                  </Badge>
                                )}
                              </div>
                              {renderStars(review.rating)}
                            </div>
                            {review.title && (
                              <h3 className="font-medium text-foreground mb-2">{review.title}</h3>
                            )}
                            {review.review && (
                              <p className="text-muted-foreground mb-3">{review.review}</p>
                            )}
                            {review.pros && review.pros.length > 0 && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-success mb-1">Pros:</p>
                                <div className="flex flex-wrap gap-2">
                                  {review.pros.map((pro: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="bg-success/5 text-success">
                                      {pro}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {review.cons && review.cons.length > 0 && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-destructive mb-1">Cons:</p>
                                <div className="flex flex-wrap gap-2">
                                  {review.cons.map((con: string, index: number) => (
                                    <Badge key={index} variant="destructive">
                                      {con}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-4">
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkHelpful(review.id)}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Helpful ({review.helpfulCount || 0})
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">Select an event to view reviews:</p>
                <div className="space-y-2">
                  {userEvents.map((event) => (
                    <Button
                      key={event.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventReviews;
