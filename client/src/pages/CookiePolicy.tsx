import MinimalHeader from "@/components/MinimalHeader";
import LegalFooter from "@/components/LegalFooter";

const CookiePolicy = () => {
  const cookieTypes = [
    {
      name: "Essential",
      description: "Required for the site to work. Login, checkout, security.",
      required: true
    },
    {
      name: "Functional",
      description: "Remember your preferences like language and theme.",
      required: false
    },
    {
      name: "Analytics",
      description: "Help us understand how you use the site to make it better.",
      required: false
    },
    {
      name: "Marketing",
      description: "Used for personalized recommendations and ads.",
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
            <div className="space-y-3">
              {cookieTypes.map((cookie, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${cookie.required ? 'bg-foreground' : 'bg-muted-foreground/40'}`} />
                  <div>
                    <span className="text-sm font-medium text-foreground">{cookie.name}</span>
                    {cookie.required && <span className="text-xs text-muted-foreground ml-2">(required)</span>}
                    <p className="text-sm text-muted-foreground">{cookie.description}</p>
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
            <h2 className="text-base font-medium text-foreground mb-2">Managing Cookies</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can control cookies through your browser settings. Note that disabling
              essential cookies may affect site functionality like staying logged in.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">Updates</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this policy as our practices change. Check back periodically.
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
