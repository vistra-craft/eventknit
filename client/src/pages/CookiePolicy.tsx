import MinimalHeader from "@/components/MinimalHeader";
import LegalFooter from "@/components/LegalFooter";

const CookiePolicy = () => {
  const cookieTypes = [
    {
      name: "Essential",
      description: "Required for the site to work. Login, checkout, security.",
      duration: "Until logout or 30 days",
      examples: ["auth_token", "session_id", "csrf_token"],
      required: true
    },
    {
      name: "Functional",
      description: "Remember your preferences like language and theme.",
      duration: "1 year",
      examples: ["theme_preference", "language_setting"],
      required: false
    },
    {
      name: "Analytics",
      description: "Help us understand how you use the site to make it better.",
      duration: "2 years",
      examples: ["_ga (Google Analytics)", "_gid"],
      required: false
    },
    {
      name: "Marketing",
      description: "Used for personalized recommendations and ads.",
      duration: "90 days",
      examples: ["recommendation_id", "campaign_tracking"],
      required: false
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MinimalHeader />

      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </div>
      </div>

      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-6 space-y-8">

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">What Are Cookies</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cookies are small text files stored on your device when you visit our site.
              They help us remember your preferences and understand how you use EventKnit.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-3">Cookies We Use</h2>
            <div className="space-y-4">
              {cookieTypes.map((cookie, index) => (
                <div key={index} className="border border-border/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${cookie.required ? 'bg-foreground' : 'bg-muted-foreground/40'}`} />
                    <div>
                      <span className="text-sm font-medium text-foreground">{cookie.name}</span>
                      {cookie.required && <span className="text-xs text-muted-foreground ml-2">(required)</span>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{cookie.description}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-medium">Duration:</span> {cookie.duration}</p>
                    <p><span className="font-medium">Examples:</span> {cookie.examples.join(", ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">Third-Party Services</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              We work with trusted services that may set their own cookies:
            </p>
            <ul className="space-y-1">
              {["Google Analytics (usage data)", "Stripe (payment processing)", "Social platforms (sharing features)"].map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">Managing & Opting Out</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can control cookies through your browser settings. Note that disabling
                essential cookies may affect site functionality like staying logged in.
              </p>
              <ul className="space-y-1">
                {[
                  "Browser Cookie Settings: Most browsers have privacy controls for cookies",
                  "Opt-Out of Analytics: Use Google Analytics opt-out browser extension",
                  "Opt-Out of Marketing: Unsubscribe links in all marketing emails",
                  "Do Not Track (DNT): We respect browser DNT signals",
                  "Cookie Preferences: Manage your choices anytime in account settings"
                ].map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-muted-foreground/50 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">Consent & GDPR Compliance</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              If you're in the EU or a jurisdiction with similar laws (GDPR/ePrivacy), we obtain your explicit consent before setting non-essential cookies. You can manage your preferences anytime. By using EventKnit, you consent to our use of essential and functional cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">Updates</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this policy as our practices change. We'll notify you of significant changes.
            </p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at <span className="text-foreground">privacy@eventknit.com</span>
            </p>
          </section>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
};

export default CookiePolicy;
