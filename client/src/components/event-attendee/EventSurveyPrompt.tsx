/**
 * EventSurveyPrompt — Attendee post-event feedback card.
 *
 * Shows in EventOverview when the event is completed and a survey exists.
 * Collects: overall rating (always), NPS, category ratings (toggleable),
 * custom questions, and open comment.
 */

import React, { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  CheckCircle,
  Send,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import {
  getSurveyForAttendee,
  submitSurveyResponse,
  type EventSurvey,
  type CustomQuestion,
} from "@/lib/survey-api";

interface EventSurveyPromptProps {
  eventId: string;
  eventStatus?: string;
}

export const EventSurveyPrompt: React.FC<EventSurveyPromptProps> = ({
  eventId,
  eventStatus,
}) => {
  const { toast } = useToast();
  const [survey, setSurvey] = useState<EventSurvey | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [venueRating, setVenueRating] = useState(0);
  const [speakerRating, setSpeakerRating] = useState(0);
  const [contentRating, setContentRating] = useState(0);
  const [orgRating, setOrgRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [customAnswers, setCustomAnswers] = useState<Record<string, unknown>>({});
  const [comment, setComment] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSurveyForAttendee(eventId);
        if (res.success && res.data) {
          setSurvey(res.data.survey);
          setHasResponded(res.data.hasResponded);
        }
      } catch {
        // No survey for this event — that's fine
      } finally {
        setLoading(false);
      }
    };

    // Only show for completed events
    if (eventStatus === "completed") {
      void load();
    } else {
      setLoading(false);
    }
  }, [eventId, eventStatus]);

  const handleSubmit = async () => {
    if (!survey || overallRating === 0) return;

    setSubmitting(true);
    try {
      await submitSurveyResponse(survey.id, {
        eventId,
        overallRating,
        npsScore: npsScore ?? undefined,
        venueRating: survey.includeVenueRating && venueRating > 0 ? venueRating : undefined,
        speakerRating: survey.includeSpeakerRating && speakerRating > 0 ? speakerRating : undefined,
        contentRating: survey.includeContentRating && contentRating > 0 ? contentRating : undefined,
        orgRating: survey.includeOrgRating && orgRating > 0 ? orgRating : undefined,
        valueRating: survey.includeValueRating && valueRating > 0 ? valueRating : undefined,
        customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
        comment: comment.trim() || undefined,
      });
      setHasResponded(true);
      toast({ title: "Thank you!", description: "Your feedback has been submitted." });
    } catch {
      toast({ title: "Error", description: "Failed to submit feedback. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if: loading, no survey, not completed, or event isn't over
  if (loading || !survey || eventStatus !== "completed") return null;

  // Already submitted
  if (hasResponded) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Feedback submitted</p>
            <p className="text-xs text-muted-foreground">Thank you for sharing your thoughts on this event</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const customQuestions = (survey.customQuestions ?? []) as CustomQuestion[];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{survey.title}</p>
              <p className="text-xs text-muted-foreground">Share your feedback about this event</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expandable form */}
        {expanded && (
          <div className="mt-5 space-y-5">
            {survey.description && (
              <p className="text-sm text-muted-foreground">{survey.description}</p>
            )}

            {/* Overall Rating — always shown */}
            <div>
              <Label className="text-sm font-medium">How would you rate this event overall?</Label>
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${star <= overallRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                    />
                  </button>
                ))}
                {overallRating > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">{overallRating}/5</span>
                )}
              </div>
            </div>

            {/* NPS Score */}
            {survey.includeNps && (
              <div>
                <Label className="text-sm font-medium">How likely are you to recommend this event? (0-10)</Label>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                    <button
                      key={score}
                      onClick={() => setNpsScore(score)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                        npsScore === score
                          ? score >= 9 ? "bg-success text-white border-success"
                            : score >= 7 ? "bg-yellow-500 text-white border-yellow-500"
                            : "bg-destructive text-white border-destructive"
                          : "bg-card border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-1">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            )}

            {/* Category Ratings */}
            {[
              { key: "venue", label: "Venue", include: survey.includeVenueRating, value: venueRating, set: setVenueRating },
              { key: "speaker", label: "Speakers", include: survey.includeSpeakerRating, value: speakerRating, set: setSpeakerRating },
              { key: "content", label: "Content", include: survey.includeContentRating, value: contentRating, set: setContentRating },
              { key: "org", label: "Organization", include: survey.includeOrgRating, value: orgRating, set: setOrgRating },
              { key: "value", label: "Value for Money", include: survey.includeValueRating, value: valueRating, set: setValueRating },
            ].filter(c => c.include).map((category) => (
              <div key={category.key}>
                <Label className="text-sm font-medium">Rate the {category.label}</Label>
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => category.set(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= category.value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom Questions */}
            {customQuestions.map((q) => (
              <div key={q.id}>
                <Label className="text-sm font-medium">{q.question}</Label>
                {q.type === "text" && (
                  <Textarea
                    className="mt-2 min-h-[60px]"
                    placeholder="Your answer..."
                    value={(customAnswers[q.id] as string) ?? ""}
                    onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  />
                )}
                {q.type === "multiple_choice" && q.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: option }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          customAnswers[q.id] === option
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "rating" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: star }))}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 ${star <= ((customAnswers[q.id] as number) ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Comment — always shown */}
            <div>
              <Label className="text-sm font-medium">Any additional comments?</Label>
              <Textarea
                className="mt-2 min-h-[80px]"
                placeholder="Share your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || overallRating === 0}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
