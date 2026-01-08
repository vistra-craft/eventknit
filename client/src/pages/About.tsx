import { Calendar, Ticket, QrCode, BarChart3, Users, ArrowRight, CheckCircle2, Bell, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast",
      description: "Create events and start selling tickets in minutes, not hours."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure",
      description: "Your data and payments are protected with enterprise-grade security."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Accessible",
      description: "Built for everyone, from small meetups to large conferences."
    }
  ];

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Event Creation",
      description: "Intuitive tools to set up events with tickets, schedules, and venues."
    },
    {
      icon: <Ticket className="w-6 h-6" />,
      title: "Ticketing & Payments",
      description: "Secure payment processing with multiple ticket types and pricing tiers."
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "QR Code Check-in",
      description: "Fast attendee check-in that works offline and syncs automatically."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics",
      description: "Real-time insights into sales, attendance, and event performance."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Attendee Management",
      description: "Manage registrations, transfers, refunds, and communications."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Notifications",
      description: "Automated emails and updates to keep attendees informed."
    }
  ];

  const steps = [
    { step: 1, title: "Create", description: "Set up your event details and tickets" },
    { step: 2, title: "Sell", description: "Share your link and start selling" },
    { step: 3, title: "Manage", description: "Track sales and communicate" },
    { step: 4, title: "Check-in", description: "Scan QR codes at the venue" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section with Gradient Background */}
      <div className="relative pt-24 pb-20 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Bringing events to{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                life
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              EventKnit is a complete event management platform that helps organizers
              create memorable experiences and attendees discover what's happening.
            </p>
          </div>
        </div>
      </div>

      {/* Value Props - 3 Column Grid */}
      <div className="py-16 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Features */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete toolkit for running successful events, from creation to check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-border bg-background hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="w-12 h-12 mb-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works - Visual Timeline */}
      <div className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground">Four simple steps to your next event.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/40 to-primary/10" />
                  )}

                  {/* Step circle */}
                  <div className="relative z-10 w-14 h-14 mx-auto mb-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/25">
                    {step.step}
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* For Organizers & Attendees */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Organizers */}
            <div className="relative p-8 rounded-2xl border border-border bg-gradient-to-br from-background to-muted/30 overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Calendar className="w-4 h-4" />
                  For Organizers
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-4">Create events that stand out</h3>

                <ul className="space-y-3 mb-6">
                  {[
                    "Unlimited events with custom branding",
                    "Flexible ticket types and pricing",
                    "Real-time sales tracking",
                    "Fast payouts to your bank"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate('/auth/register/organizer')}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  Start Creating Events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* For Attendees */}
            <div className="relative p-8 rounded-2xl border border-border bg-gradient-to-br from-background to-muted/30 overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Ticket className="w-4 h-4" />
                  For Attendees
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-4">Discover and attend with ease</h3>

                <ul className="space-y-3 mb-6">
                  {[
                    "Find events happening near you",
                    "Simple and secure checkout",
                    "Mobile tickets with QR code",
                    "Easy ticket transfers"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Browse Events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of organizers creating amazing events on EventKnit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth/register/organizer')}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              Create Your First Event
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
              className="border-border hover:bg-muted"
            >
              Explore Events
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
