import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, AlertTriangle, Users, CreditCard, Shield } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 via-background to-muted/10 pt-16 pb-4 md:pt-20 md:pb-6">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl bg-white px-6 py-8 md:px-10 md:py-10">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="space-y-3">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    EventKnit Terms of Service
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    These terms explain the conditions for using EventKnit. By accessing or using our
                    platform, you agree to the rules outlined on this page.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Last updated • January 15, 2025</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Applies to organizers and attendees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-0 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Acceptance of Terms */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Scale className="w-5 h-5 text-primary" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using EventKnit's platform, you accept and agree to be bound 
                by the terms and provision of this agreement. If you do not agree to abide 
                by the above, please do not use this service.
              </p>
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Important:</strong> These terms constitute a legally binding agreement 
                  between you and EventKnit. Please read them carefully.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="w-5 h-5 text-primary" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                EventKnit provides an online platform that connects event organizers with attendees, 
                facilitating event discovery, registration, ticketing, and management services.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">For Event Organizers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Create and manage events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Process ticket sales and payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Manage attendee registrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Access analytics and reporting</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">For Attendees</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Discover and browse events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Register and purchase tickets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Receive event updates and confirmations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Access event information and materials</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertTriangle className="w-5 h-5 text-primary" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-3">Account Security</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Maintain accurate and up-to-date account information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Keep your login credentials secure and confidential</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Notify us immediately of any unauthorized access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>Use strong, unique passwords for your account</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-base font-semibold mb-3">Prohibited Activities</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Content Restrictions</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• No illegal or harmful content</li>
                      <li>• No spam or unsolicited communications</li>
                      <li>• No copyright infringement</li>
                      <li>• No harassment or abuse</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Platform Misuse</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• No automated scraping or crawling</li>
                      <li>• No reverse engineering</li>
                      <li>• No unauthorized access attempts</li>
                      <li>• No commercial use without permission</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed securely through our trusted payment partners. 
                By making a purchase, you agree to the following terms:
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold mb-2">Payment Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Payments are processed immediately upon purchase. We accept major credit cards, 
                    debit cards, and other payment methods as displayed during checkout.
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold mb-2">Refund Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    Refunds are subject to the individual event organizer's refund policy. 
                    EventKnit facilitates refunds but does not guarantee them. Contact the 
                    event organizer directly for refund requests.
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold mb-2">Service Fees</h4>
                  <p className="text-sm text-muted-foreground">
                    EventKnit may charge service fees for ticket processing and platform usage. 
                    These fees are clearly displayed before purchase and are non-refundable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                The EventKnit platform, including its design, functionality, and content, 
                is protected by intellectual property laws. You may not:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs">×</span>
                    </div>
                    <span className="text-sm">Copy or reproduce our platform</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs">×</span>
                    </div>
                    <span className="text-sm">Create derivative works</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs">×</span>
                    </div>
                    <span className="text-sm">Use our trademarks without permission</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs">×</span>
                    </div>
                    <span className="text-sm">Reverse engineer our systems</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs">×</span>
                    </div>
                    <span className="text-sm">Remove copyright notices</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs">×</span>
                    </div>
                    <span className="text-sm">Distribute our content commercially</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Shield className="w-5 h-5 text-primary" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                EventKnit provides its services "as is" and makes no warranties regarding 
                the availability, accuracy, or reliability of our platform. Our liability 
                is limited as follows:
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Service Availability</h4>
                  <p className="text-sm text-muted-foreground">
                    We strive to maintain high service availability but cannot guarantee 
                    uninterrupted access. We are not liable for temporary service disruptions.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Event Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Event organizers are responsible for the accuracy of their event information. 
                    We are not liable for incorrect event details or cancellations.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Maximum Liability</h4>
                  <p className="text-sm text-muted-foreground">
                    Our total liability for any claims arising from your use of our services 
                    shall not exceed the amount you paid for the specific service in question.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Either party may terminate this agreement at any time. Upon termination:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Your Rights</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Access your account data for 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Export your event and attendee data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Request data deletion</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Our Rights</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Suspend accounts for policy violations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Terminate services with notice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span>Retain data as required by law</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws 
                of the State of California, without regard to its conflict of law provisions.
              </p>
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Dispute Resolution:</strong> Any disputes arising from these terms 
                  or your use of our services shall be resolved through binding arbitration 
                  in San Francisco, California.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-sm text-muted-foreground">legal@eventknit.com</div>
                  </div>
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold">Address</div>
                    <div className="text-sm text-muted-foreground">
                      EventKnit Legal Department<br />
                      123 Event Street<br />
                      San Francisco, CA 94105
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users 
                of significant changes via email or through our platform. Continued use of our 
                services after changes constitutes acceptance of the new terms.
              </p>
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Recommendation:</strong> We encourage you to review these terms 
                  periodically to stay informed of any updates or changes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;
