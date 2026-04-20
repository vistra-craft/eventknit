import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Support = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: "How do I get a refund?",
      a: "You can request a refund up to 24 hours before the event. Go to your tickets, select the order, and click 'Request Refund'. Full refunds are automatic if the organizer cancels."
    },
    {
      q: "Where are my tickets?",
      a: "Tickets are emailed to you after purchase. Check your spam folder. You can also view them anytime in your account under 'My Tickets'."
    },
    {
      q: "Can I transfer my ticket to someone else?",
      a: "Yes, most tickets can be transferred. Go to your ticket, click 'Transfer', and enter the recipient's email. They'll receive the ticket instantly."
    },
    {
      q: "Payment failed but I was charged",
      a: "If your payment failed but you see a charge, it's likely a pending authorization that will be released within 3-5 business days. If not, contact us with your order details."
    },
    {
      q: "How do I contact the event organizer?",
      a: "On the event page, scroll down to find the organizer's contact information. You can also message them through the 'Contact Organizer' button."
    },
    {
      q: "I didn't receive my confirmation email",
      a: "Check your spam/junk folder first. If it's not there, log into your account to verify your purchase, or contact us with your email and we'll resend it."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-8 mt-16">
          <h1 className="text-2xl font-bold text-foreground mb-1">Support</h1>
          <p className="text-sm text-muted-foreground">Find answers or get in touch</p>
        </div>
      </div>

      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-6 space-y-10">

          {/* FAQ Section */}
          <section>
            <h2 className="text-base font-medium text-foreground mb-4">Common Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-border rounded-lg">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
                  >
                    {faq.q}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-3 text-sm text-muted-foreground">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h2 className="text-base font-medium text-foreground mb-4">Still need help?</h2>

            {submitted ? (
              <div className="text-center py-8 border border-border rounded-lg bg-muted/20">
                <p className="text-sm text-foreground font-medium mb-1">Message sent</p>
                <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <Textarea
                  placeholder="How can we help?"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
                <Button type="submit">Send Message</Button>
              </form>
            )}
          </section>

          {/* Direct Contact */}
          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Or email us directly at <a href="mailto:support@eventknit.com" className="text-foreground hover:underline">support@eventknit.com</a>
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Support;
