import { useState } from "react";
import { Send, Users, TrendingUp, Calendar, Sparkles, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { apiPost } from "@/lib/api";

const Careers = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areas = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Sales & Growth",
      description: "Help event organizers discover EventKnit and grow our presence in new markets."
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Marketing",
      description: "Tell our story, build our brand, and connect with communities that love events."
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Events & Partnerships",
      description: "Coordinate with organizers, manage relationships, and ensure events run smoothly."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Operations",
      description: "Keep things running, support our users, and help scale what works."
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiPost("/careers", { email });
      setIsSubmitted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message :
        (err && typeof err === 'object' && 'message' in err) ? String((err as Record<string, unknown>).message) :
        "Something went wrong. Please try again.";
      setError(errorMessage || "Something went wrong. Please try again.");
      console.error("Career inquiry error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Check your inbox</h1>
            <p className="text-muted-foreground mb-2">
              We've sent you an email at <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              It contains everything you need to tell us your story. Take your time — we'll be waiting.
            </p>
            <Button variant="outline" onClick={() => { setIsSubmitted(false); setEmail(""); }}>
              Use a different email
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Hero */}
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Tell us your story. That's all we need.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're looking for people who are excited about events, growth, and building something real.
              Drop your email and we'll send you a simple prompt to get started.
            </p>
          </div>
        </div>

        {/* Email Capture */}
        <div className="py-12 px-6">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  Start
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
          {error && (
            <p className="text-xs text-destructive text-center mt-3 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
          <p className="text-xs text-muted-foreground text-center mt-3">
            You'll receive an email with a simple prompt. Reply whenever you're ready.
          </p>
        </div>
      </div>

      {/* Areas we're growing */}
        <div className="py-12 border-y border-border bg-muted/20">
        <div className="container mx-auto px-6">
          <p className="text-sm font-medium text-muted-foreground text-center mb-8">
            Areas we're growing
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
            {areas.map((area, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 mb-3 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {area.icon}
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">{area.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;
