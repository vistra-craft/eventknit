import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, CheckCircle, AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { validateFeedbackToken, submitFeedbackViaToken } from "@/lib/feedback-api";
import Logo from "@/components/Logo";

const IMPROVEMENT_AREAS = [
  { id: "registration", label: "Registration Process" },
  { id: "payments", label: "Payments" },
  { id: "notifications", label: "Notifications" },
  { id: "ui", label: "User Interface" },
  { id: "mobile", label: "Mobile Experience" },
  { id: "communication", label: "Event Communications" },
  { id: "support", label: "Customer Support" },
];

const FeedbackPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");

  // Form state
  const [npsScore, setNpsScore] = useState<number | null>(
    searchParams.get("nps") ? parseInt(searchParams.get("nps")!) : null
  );
  const [comment, setComment] = useState("");
  const [eventQuality, setEventQuality] = useState<number | null>(null);
  const [platformUsability, setPlatformUsability] = useState<number | null>(null);
  const [registrationProcess, setRegistrationProcess] = useState<number | null>(null);
  const [communicationQuality, setCommunicationQuality] = useState<number | null>(null);
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [wouldUseAgain, setWouldUseAgain] = useState<boolean | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const validateToken = useCallback(async () => {
    try {
      const res = await validateFeedbackToken(token!) as { success: boolean; data?: { valid: boolean; eventTitle?: string } };
      if (res.success && res.data?.valid) {
        setEventTitle(res.data.eventTitle || "your event");
      } else {
        setError("This feedback link is invalid or has expired.");
      }
    } catch {
      setError("This feedback link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError("Invalid feedback link");
      setLoading(false);
    }
  }, [token, validateToken]);

  const handleSubmit = async () => {
    if (npsScore === null) {
      return;
    }

    try {
      setSubmitting(true);
      await submitFeedbackViaToken(token!, {
        npsScore,
        comment: comment || undefined,
        eventQuality: eventQuality || undefined,
        platformUsability: platformUsability || undefined,
        registrationProcess: registrationProcess || undefined,
        communicationQuality: communicationQuality || undefined,
        improvementAreas: improvementAreas.length > 0 ? improvementAreas : undefined,
        wouldUseAgain: wouldUseAgain ?? undefined,
        wouldRecommend: wouldRecommend ?? undefined,
      });
      setSubmitted(true);
    } catch {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleImprovementArea = (area: string) => {
    setImprovementAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const renderStarRating = (
    value: number | null,
    onChange: (value: number) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                value !== null && star <= value
                  ? "fill-warning text-warning"
                  : "text-muted-foreground hover:text-warning"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted successfully. We appreciate your time!
            </p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold mt-4">Share Your Feedback</h1>
          <p className="text-muted-foreground mt-2">
            Help us improve by sharing your experience with <strong>{eventTitle}</strong>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How likely are you to recommend EventKnit?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* NPS Score */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Not at all likely</span>
                <span>Extremely likely</span>
              </div>
              <div className="flex justify-between gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setNpsScore(score)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      npsScore === score
                        ? score <= 6
                          ? "bg-destructive/50 text-white"
                          : score <= 8
                          ? "bg-warning/50 text-white"
                          : "bg-success/50 text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {npsScore !== null && (
                <p className="text-center text-sm">
                  {npsScore <= 6 && (
                    <span className="text-destructive">
                      We're sorry to hear that. Please tell us how we can improve.
                    </span>
                  )}
                  {npsScore >= 7 && npsScore <= 8 && (
                    <span className="text-warning">
                      Thanks! What would make your experience even better?
                    </span>
                  )}
                  {npsScore >= 9 && (
                    <span className="text-success">
                      Awesome! We're glad you had a great experience.
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Tell us more (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Share any additional thoughts or suggestions..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            {/* Category Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderStarRating(eventQuality, setEventQuality, "Event Quality")}
              {renderStarRating(
                platformUsability,
                setPlatformUsability,
                "Platform Usability"
              )}
              {renderStarRating(
                registrationProcess,
                setRegistrationProcess,
                "Registration Process"
              )}
              {renderStarRating(
                communicationQuality,
                setCommunicationQuality,
                "Communication Quality"
              )}
            </div>

            {/* Improvement Areas */}
            <div className="space-y-3">
              <Label>What could we improve? (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {IMPROVEMENT_AREAS.map((area) => (
                  <label
                    key={area.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      improvementAreas.includes(area.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={improvementAreas.includes(area.id)}
                      onCheckedChange={() => toggleImprovementArea(area.id)}
                    />
                    <span className="text-sm">{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Would Use Again / Recommend */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Would you use EventKnit again?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={wouldUseAgain === true ? "default" : "outline"}
                    onClick={() => setWouldUseAgain(true)}
                    className="flex-1"
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={wouldUseAgain === false ? "default" : "outline"}
                    onClick={() => setWouldUseAgain(false)}
                    className="flex-1"
                  >
                    No
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Would you recommend EventKnit?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={wouldRecommend === true ? "default" : "outline"}
                    onClick={() => setWouldRecommend(true)}
                    className="flex-1"
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRecommend === false ? "default" : "outline"}
                    onClick={() => setWouldRecommend(false)}
                    className="flex-1"
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={npsScore === null || submitting}
            >
              {submitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your feedback is anonymous and will be used to improve our platform.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackPage;
