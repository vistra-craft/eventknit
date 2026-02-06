import { Calendar, Ticket, QrCode, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Create Events",
      description: "Set up events with custom tickets, schedules, and venues in minutes."
    },
    {
      icon: <Ticket className="w-5 h-5" />,
      title: "Sell Tickets",
      description: "Secure payments with flexible pricing tiers and fast payouts."
    },
    {
      icon: <QrCode className="w-5 h-5" />,
      title: "Check-in",
      description: "QR code scanning that works offline and syncs automatically."
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Track Everything",
      description: "Real-time insights into sales, attendance, and performance."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Hero */}
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Event management that just works
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              EventKnit helps organizers create, sell, and manage events, and helps attendees
              discover what's happening. Fast, secure, and built for everyone.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="py-12 border-y border-border bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
        <div className="py-16 px-6">
          <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground mb-3">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first event or browse what's happening near you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/auth/register/organizer')}>
              Create Event
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Browse Events
            </Button>
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
