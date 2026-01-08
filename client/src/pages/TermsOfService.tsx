import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MinimalHeader from "@/components/MinimalHeader";
import LegalFooter from "@/components/LegalFooter";
import { Scale, AlertTriangle, Users, CreditCard, Shield, Clock, RefreshCcw } from "lucide-react";

const TermsOfService = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MinimalHeader />
      
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: January 15, 2025
          </p>
        </div>
      </div>

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          
          {/* Acceptance of Terms */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Acceptance of Terms
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using EventKnit's platform, you accept and agree to be bound
                by the terms and provision of this agreement. If you do not agree to abide
                by the above, please do not use this service.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Important:</strong> These terms constitute a legally binding agreement
                  between you and EventKnit. Please read them carefully.
                </p>
              </div>
            </div>
          </section>

          {/* Service Description */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Service Description
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                EventKnit provides an online platform that connects event organizers with attendees, 
                facilitating event discovery, registration, ticketing, and management services.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">For Event Organizers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Create and manage events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Process ticket sales and payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Manage attendee registrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Access analytics and reporting</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">For Attendees</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Discover and browse events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Register and purchase tickets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Receive event updates and confirmations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Access event information and materials</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="space-y-6">
            <h2 className="text-lg font-medium text-foreground">
              User Responsibilities
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-3">Account Security</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Maintain accurate and up-to-date account information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Keep your login credentials secure and confidential</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Notify us immediately of any unauthorized access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Use strong, unique passwords for your account</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-base font-medium mb-3">Prohibited Activities</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Content Restrictions</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• No illegal or harmful content</li>
                      <li>• No spam or unsolicited communications</li>
                      <li>• No copyright infringement</li>
                      <li>• No harassment or abuse</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Platform Misuse</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• No automated scraping or crawling</li>
                      <li>• No reverse engineering</li>
                      <li>• No unauthorized access attempts</li>
                      <li>• No commercial use without permission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Payment Terms
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed securely through our trusted payment partners. 
                By making a purchase, you agree to the following terms:
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Payment Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Payments are processed immediately upon purchase. We accept major credit cards, 
                    debit cards, and other payment methods as displayed during checkout.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Service Fees</h4>
                  <p className="text-sm text-muted-foreground">
                    EventKnit may charge service fees for ticket processing and platform usage. 
                    These fees are clearly displayed before purchase and are non-refundable.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Refund Policy */}
          <section id="refund-policy" className="scroll-mt-20 space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Refund Policy
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Our refund policy is designed to provide flexibility and protection for both event organizers and attendees.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Free Cancellation</h4>
                    <p className="text-sm text-muted-foreground">
                      Cancel up to 24 hours before the event for a full refund
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <RefreshCcw className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Easy Transfer</h4>
                    <p className="text-sm text-muted-foreground">
                      Transfer tickets to friends if you can't make it
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Event Cancellation</h4>
                    <p className="text-sm text-muted-foreground">
                      Full refund if the event is cancelled by the organizer
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Refunds are processed within 5-7 business days. Service fees may be non-refundable 
                  depending on the cancellation timing.
                </p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Intellectual Property</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The EventKnit platform, including its design, functionality, and content, 
                is protected by intellectual property laws. You may not:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground text-xs">×</span>
                    </div>
                    <span className="text-sm">Copy or reproduce our platform</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground text-xs">×</span>
                    </div>
                    <span className="text-sm">Create derivative works</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground text-xs">×</span>
                    </div>
                    <span className="text-sm">Use our trademarks without permission</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground text-xs">×</span>
                    </div>
                    <span className="text-sm">Reverse engineer our systems</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground text-xs">×</span>
                    </div>
                    <span className="text-sm">Remove copyright notices</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground text-xs">×</span>
                    </div>
                    <span className="text-sm">Distribute our content commercially</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Limitation of Liability
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                EventKnit provides its services "as is" and makes no warranties regarding 
                the availability, accuracy, or reliability of our platform. Our liability 
                is limited as follows:
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Service Availability</h4>
                  <p className="text-sm text-muted-foreground">
                    We strive to maintain high service availability but cannot guarantee 
                    uninterrupted access. We are not liable for temporary service disruptions.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Event Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Event organizers are responsible for the accuracy of their event information. 
                    We are not liable for incorrect event details or cancellations.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Maximum Liability</h4>
                  <p className="text-sm text-muted-foreground">
                    Our total liability for any claims arising from your use of our services 
                    shall not exceed the amount you paid for the specific service in question.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Termination</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Either party may terminate this agreement at any time. Upon termination:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Your Rights</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Access your account data for 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Export your event and attendee data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Request data deletion</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Our Rights</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Suspend accounts for policy violations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Terminate services with notice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Retain data as required by law</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Governing Law</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws 
                of the State of California, without regard to its conflict of law provisions.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Dispute Resolution:</strong> Any disputes arising from these terms 
                  or your use of our services shall be resolved through binding arbitration 
                  in San Francisco, California.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Contact Information</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">legal@eventknit.com</div>
                  </div>
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-sm text-muted-foreground">
                      EventKnit Legal Department<br />
                      123 Event Street<br />
                      San Francisco, CA 94105
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Changes to Terms</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users 
                of significant changes via email or through our platform. Continued use of our 
                services after changes constitutes acceptance of the new terms.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Recommendation:</strong> We encourage you to review these terms 
                  periodically to stay informed of any updates or changes.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
};

export default TermsOfService;
