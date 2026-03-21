/**
 * EventSurveyPage — Standalone page for the post-event survey.
 *
 * Accessed via email link: /events/:eventId/survey
 * Works for authenticated and unauthenticated users (redirects to login if needed).
 */

import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventSurveyPrompt } from "@/components/event-attendee/EventSurveyPrompt";

const EventSurveyPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Invalid survey link.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pb-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <EventSurveyPrompt eventId={eventId} eventStatus="completed" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventSurveyPage;
