import MinimalHeader from "@/components/MinimalHeader";
import LegalFooter from "@/components/LegalFooter";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "What We Collect",
      subsections: [
        {
          subtitle: "Information you provide",
          items: ["Name and email", "Payment details (processed by secure partners)", "Event preferences"]
        },
        {
          subtitle: "Collected automatically",
          items: ["Device and browser info", "IP address", "Pages visited"]
        }
      ]
    },
    {
      title: "How We Use It",
      items: [
        "Process registrations and payments",
        "Send event updates and confirmations",
        "Improve the platform",
        "Prevent fraud"
      ]
    },
    {
      title: "Who We Share With",
      items: [
        "Event organizers (to facilitate your attendance)",
        "Payment processors (Stripe, etc.)",
        "Analytics services",
        "When required by law"
      ],
      note: "We never sell your personal information."
    },
    {
      title: "Your Rights",
      items: [
        "Access your data",
        "Correct inaccurate information",
        "Request deletion",
        "Withdraw consent"
      ]
    },
    {
      title: "Security",
      content: "We use SSL encryption, secure storage, and regular security audits to protect your data."
    },
    {
      title: "Updates",
      content: "We may update this policy and will notify you of significant changes. Continued use means acceptance."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MinimalHeader />

      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </div>
      </div>

      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-6 space-y-8">
          {sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-base font-medium text-foreground mb-2">{section.title}</h2>

              {section.content && (
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              )}

              {section.subsections && (
                <div className="space-y-3">
                  {section.subsections.map((sub, i) => (
                    <div key={i}>
                      <h3 className="text-sm text-muted-foreground mb-1">{sub.subtitle}</h3>
                      <ul className="space-y-0.5 pl-4">
                        {sub.items.map((item, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-muted-foreground/50 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {section.items && !section.subsections && (
                <ul className="space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground/50 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <p className="text-sm text-foreground mt-2">{section.note}</p>
              )}
            </section>
          ))}

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

export default PrivacyPolicy;
