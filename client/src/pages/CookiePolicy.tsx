import MinimalHeader from "@/components/MinimalHeader";
import LegalFooter from "@/components/LegalFooter";
import { Cookie, Settings, BarChart3, Shield, Eye, Database } from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MinimalHeader />
      
      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Cookie Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: January 15, 2025
          </p>
        </div>
      </div>

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          
          {/* What Are Cookies */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              What Are Cookies?
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your device when you visit 
                our website. They help us provide you with a better experience by remembering 
                your preferences and enabling certain functionality.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-base">How Cookies Work</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Stored in your browser when you visit our site</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Sent back to our servers on subsequent visits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Enable personalized experiences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Help us understand how you use our platform</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-base">Types of Data</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Login status and user preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Language and region settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Website usage patterns and analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Security and fraud prevention data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Types of Cookies We Use */}
          <section className="space-y-6">
            <h2 className="text-lg font-medium text-foreground">
              Types of Cookies We Use
            </h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/5 rounded-lg">
                    <h4 className="font-medium text-base mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      Essential Cookies
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      These cookies are necessary for the website to function properly and cannot be disabled.
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• User authentication and login status</li>
                      <li>• Shopping cart and checkout functionality</li>
                      <li>• Security and fraud prevention</li>
                      <li>• Basic website navigation</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-muted/5 rounded-lg">
                    <h4 className="font-medium text-base mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      Functional Cookies
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      These cookies enhance your experience by remembering your preferences.
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Language and region preferences</li>
                      <li>• Theme and display settings</li>
                      <li>• Recently viewed events</li>
                      <li>• Form data and user inputs</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-muted/5 rounded-lg">
                    <h4 className="font-medium text-base mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted/80 rounded-full"></div>
                      Analytics Cookies
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      These cookies help us understand how visitors interact with our website.
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Page views and user journeys</li>
                      <li>• Popular events and features</li>
                      <li>• Performance metrics</li>
                      <li>• Error tracking and debugging</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-muted/5 rounded-lg">
                    <h4 className="font-medium text-base mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      Marketing Cookies
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      These cookies are used to deliver relevant advertisements and track campaign effectiveness.
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Personalized event recommendations</li>
                      <li>• Social media integration</li>
                      <li>• Advertising campaign tracking</li>
                      <li>• Cross-site tracking for retargeting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Third-Party Cookies
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We work with trusted third-party services that may set their own cookies 
                on our website. These services help us provide better functionality and analytics.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-base mb-2">Google Analytics</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Helps us understand website traffic and user behavior patterns.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Cookies:</strong> _ga, _gid, _gat, _gcl_au
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-base mb-2">Payment Processors</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Secure payment processing and fraud prevention services.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Services:</strong> Stripe, PayPal, Square
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-base mb-2">Social Media</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Social sharing buttons and embedded content from social platforms.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Platforms:</strong> Facebook, Twitter, Instagram, LinkedIn
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-base mb-2">Customer Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Live chat and customer support functionality.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Services:</strong> Intercom, Zendesk, Freshchat
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cookie Management */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Managing Your Cookie Preferences
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                You have several options for managing cookies on our website:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-base">Browser Settings</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-medium text-sm mb-1">Chrome</h5>
                      <p className="text-xs text-muted-foreground">
                        Settings → Privacy and security → Cookies and other site data
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-medium text-sm mb-1">Firefox</h5>
                      <p className="text-xs text-muted-foreground">
                        Options → Privacy & Security → Cookies and Site Data
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-medium text-sm mb-1">Safari</h5>
                      <p className="text-xs text-muted-foreground">
                        Preferences → Privacy → Manage Website Data
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-medium text-sm mb-1">Edge</h5>
                      <p className="text-xs text-muted-foreground">
                        Settings → Cookies and site permissions → Cookies and site data
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-base">Cookie Consent</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/5 rounded-lg">
                      <h5 className="font-medium mb-2">Cookie Banner</h5>
                      <p className="text-sm text-muted-foreground">
                        Use our cookie consent banner to accept or decline non-essential cookies.
                      </p>
                    </div>
                    <div className="p-4 bg-muted/5 rounded-lg">
                      <h5 className="font-medium mb-2">Preference Center</h5>
                      <p className="text-sm text-muted-foreground">
                        Access our cookie preference center to customize your cookie settings.
                      </p>
                    </div>
                    <div className="p-4 bg-muted/5 rounded-lg">
                      <h5 className="font-medium mb-2">Opt-Out Links</h5>
                      <p className="text-sm text-muted-foreground">
                        Use opt-out links provided by third-party services to disable their cookies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Impact of Disabling Cookies */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Impact of Disabling Cookies
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                While you can disable cookies, doing so may affect your experience on our website:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-base text-muted-foreground">Potential Issues</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Unable to stay logged in</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Lost shopping cart contents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>No personalized recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Reduced website functionality</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-base text-muted-foreground">Still Available</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Basic website navigation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Event browsing and discovery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Contact and support features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Essential security features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Cookie Data Retention
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Different types of cookies have different retention periods:
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-base mb-2">Session Cookies</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    These cookies are deleted when you close your browser.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Retention:</strong> Until browser session ends
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-base mb-2">Persistent Cookies</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    These cookies remain on your device for a set period of time.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Retention:</strong> 30 days to 2 years (varies by cookie type)
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-base mb-2">Third-Party Cookies</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Retention periods are determined by the third-party service providers.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Retention:</strong> Varies by service (typically 1-2 years)
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security and Privacy */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Security and Privacy
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We take the security and privacy of your data seriously. Our cookie practices 
                are designed to protect your information while providing you with the best possible experience.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-base">Security Measures</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Encrypted data transmission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Secure cookie storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Regular security audits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Compliance with privacy regulations</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-base">Privacy Protection</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>No personal data in cookies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Anonymized analytics data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>User consent for non-essential cookies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></span>
                      <span>Easy opt-out mechanisms</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Contact Us About Cookies</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, 
                please contact us:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-base">Email</div>
                    <div className="text-sm text-muted-foreground">privacy@eventknit.com</div>
                  </div>
                  <div>
                    <div className="font-medium text-base">Phone</div>
                    <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-base">Address</div>
                    <div className="text-sm text-muted-foreground">
                      EventKnit Privacy Team<br />
                      123 Event Street<br />
                      San Francisco, CA 94105
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Policy Updates */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Policy Updates</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our 
                practices or for other operational, legal, or regulatory reasons. We will notify 
                you of any material changes by posting the updated policy on our website.
              </p>
              <div className="p-4 bg-muted/5 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Recommendation:</strong> We encourage you to review this Cookie Policy 
                  periodically to stay informed about how we use cookies and similar technologies.
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

export default CookiePolicy;
