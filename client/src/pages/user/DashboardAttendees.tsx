import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Network } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

/**
 * DashboardAttendees
 *
 * Attendee networking / discovery is implemented in AttendeeDiscovery.
 * This view provides a clean landing that routes users there.
 *
 * Full peer-attendee listing (with privacy controls) is pending backend
 * implementation of /api/v1/events/:id/attendees (public profile endpoint).
 */
const DashboardAttendees: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
      <Card variant="github" className="overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Attendee Networking</h1>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Discover and connect with fellow attendees at your events
          </p>
        </div>

        <CardContent className="p-8 space-y-6">
          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/user/dashboard?section=networking')}
              className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Attendee Discovery
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Find and follow attendees who share your interests
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/user/dashboard?section=social')}
              className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/15 transition-colors">
                <Network className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  Social Networking
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage connections and your professional network
                </p>
              </div>
            </button>
          </div>

          {/* CTA */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              onClick={() => navigate('/user/dashboard?section=networking')}
            >
              <Users className="w-4 h-4 mr-2" />
              Discover Attendees
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/user/dashboard?section=messages')}
            >
              Go to Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAttendees;
