import { useState } from "react";
import { Mail, MessageCircle, Send, AlertCircle, CheckCircle, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { apiPost } from "@/lib/api";

const WHATSAPP_NUMBER = "254700000000"; // replace with real number
const CONTACT_EMAIL = "hello@festhub.events";

const CHANNELS = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Email us",
    description: "We aim to respond within one business day.",
    action: `mailto:${CONTACT_EMAIL}`,
    label: CONTACT_EMAIL,
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: "WhatsApp",
    description: "Chat with us directly — fastest way to reach us.",
    action: `https://wa.me/${WHATSAPP_NUMBER}`,
    label: `+${WHATSAPP_NUMBER}`,
  },
  {
    icon: <Instagram className="w-5 h-5" />,
    title: "Instagram",
    description: "DM us or follow for event highlights and updates.",
    action: "https://instagram.com/festhubevents",
    label: "@festhubevents",
  },
  {
    icon: <Twitter className="w-5 h-5" />,
    title: "X (Twitter)",
    description: "Tag us or send a DM — we're active here too.",
    action: "https://x.com/festhubevents",
    label: "@festhubevents",
  },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await apiPost("/contact", form);
      setIsSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message :
        (err && typeof err === "object" && "message" in err) ? String((err as Record<string, unknown>).message) :
        "Something went wrong. Please try again.";
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col justify-center">
        {/* Hero */}
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              We'd love to hear from you
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you have a question, a partnership idea, or just want to say hi — pick the channel that works best for you.
            </p>
          </div>
        </div>

        {/* Contact channel cards */}
        <div className="py-12 border-y border-border bg-muted/20">
          <div className="container mx-auto px-6">
            <p className="text-sm font-medium text-muted-foreground text-center mb-8">
              Ways to reach us
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
              {CHANNELS.map((channel) => (
                <a
                  key={channel.title}
                  href={channel.action}
                  target={channel.action.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors group"
                >
                  <div className="w-10 h-10 mb-3 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    {channel.icon}
                  </div>
                  <h3 className="font-medium text-foreground text-sm mb-1">{channel.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{channel.description}</p>
                  <span className="text-xs font-medium text-primary">{channel.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="py-12 px-6">
          <div className="max-w-lg mx-auto">
            <p className="text-sm font-medium text-muted-foreground text-center mb-8">
              Or send us a message
            </p>

            <div className="rounded-xl border border-border bg-background p-6">
              {isSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto mb-4 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Message sent</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    We'll get back to you at <span className="font-medium text-foreground">{form.email}</span> within one business day.
                  </p>
                  <Button variant="outline" onClick={() => { setIsSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      name="name"
                      placeholder="Your name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="rounded-lg border-border focus-visible:border-primary/50"
                    />
                    <Input
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="rounded-lg border-border focus-visible:border-primary/50"
                    />
                  </div>
                  <Input
                    name="subject"
                    placeholder="Subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="rounded-lg border-border focus-visible:border-primary/50"
                  />
                  <Textarea
                    name="message"
                    placeholder="What's on your mind?"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className="resize-none rounded-lg border-border focus-visible:border-primary/50"
                  />
                  {error && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Sending..." : (
                      <>Send message <Send className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
