import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MinimalHeader from '@/components/layout/MinimalHeader';
import LegalFooter from '@/components/layout/LegalFooter';

const sections = [
  {
    id: "what-are-cookies",
    number: "1",
    title: "What Are Cookies",
    content: `Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, to remember your preferences, and to provide information to the site owners about how their site is being used.

Cookies can be "first-party" (set by the website you are visiting) or "third-party" (set by a service used by the website, such as an analytics or advertising provider). They can also be "session" cookies (deleted when you close your browser) or "persistent" cookies (stored on your device for a set period or until you manually delete them).

This Cookie Policy explains which cookies we use on the EventKnit platform, why we use them, and how you can manage your preferences. This policy should be read in conjunction with our Privacy Policy, which provides additional detail on how we handle your personal information.`
  },
  {
    id: "how-we-use",
    number: "2",
    title: "How We Use Cookies",
    content: `We use cookies and similar technologies for several important purposes. These include enabling core functionality of the platform (such as keeping you logged in and processing secure transactions), remembering your preferences and settings (such as your chosen language or theme), understanding how you interact with the platform so we can improve the user experience, measuring the effectiveness of our communications and marketing efforts, and providing security features that help protect your account and our platform from unauthorized access or fraudulent activity.

We are committed to using cookies responsibly and transparently. We only set non-essential cookies with your consent, and we provide clear mechanisms for you to manage your preferences at any time.`
  },
  {
    id: "essential",
    number: "3",
    title: "Essential Cookies",
    content: `Essential cookies are strictly necessary for the operation of the EventKnit platform. Without these cookies, core features such as logging in, navigating between pages, and completing transactions would not function properly. Because these cookies are required for the platform to work, they cannot be disabled.

Our essential cookies include authentication tokens that keep you securely logged in during your session, session identifiers that maintain your browsing session and shopping cart state, CSRF (Cross-Site Request Forgery) tokens that protect against certain types of cyberattacks, and load balancing cookies that distribute traffic across our servers to ensure consistent performance.

These cookies are typically set when you perform an action that constitutes a request for services, such as logging in, filling out a form, or adjusting your privacy settings. They are usually session cookies that expire when you close your browser, though some authentication cookies may persist for up to thirty (30) days if you choose to remain logged in.`
  },
  {
    id: "functional",
    number: "4",
    title: "Functional Cookies",
    content: `Functional cookies enable the platform to remember choices you make and provide enhanced, personalized features. These cookies are not strictly necessary for the platform to operate, but they significantly improve your experience by remembering your settings and preferences.

Examples of functional cookies we use include theme preference cookies that remember whether you prefer a light or dark interface, language setting cookies that store your preferred language for displaying content, and notification preference cookies that remember how you want to receive alerts and updates.

Functional cookies typically persist for one (1) year from the date they are set, unless you clear them manually or withdraw your consent. Disabling functional cookies will not prevent you from using the platform, but you may need to re-enter your preferences each time you visit.`
  },
  {
    id: "analytics",
    number: "5",
    title: "Analytics Cookies",
    content: `Analytics cookies help us understand how visitors interact with the EventKnit platform by collecting and reporting information about usage patterns. This data is aggregated and anonymized, meaning we cannot use it to identify individual users. Analytics cookies help us identify which pages and features are most popular, understand how users navigate through the platform, detect technical issues such as broken links or slow-loading pages, and measure the effectiveness of changes and improvements we make.

We use Google Analytics as our primary analytics service. Google Analytics sets cookies (such as _ga and _gid) that collect information about your browsing behavior, including the pages you visit, how long you spend on each page, and how you arrived at the platform. This data is processed by Google in accordance with their privacy policy, which you can review at policies.google.com/privacy.

Analytics cookies typically persist for up to two (2) years. You can opt out of Google Analytics tracking by installing the Google Analytics opt-out browser extension, available at tools.google.com/dlpage/gaoptout.`
  },
  {
    id: "marketing",
    number: "6",
    title: "Marketing Cookies",
    content: `Marketing cookies are used to deliver more relevant content and to measure the effectiveness of our marketing campaigns. These cookies track your activity across the platform and, in some cases, across other websites, to build a profile of your interests and show you content that is more likely to be relevant to you.

Our marketing cookies include recommendation identifiers that help us suggest events based on your browsing history and past registrations, campaign tracking cookies that help us understand which marketing channels drive the most engagement, and conversion tracking cookies that measure whether a marketing campaign led to an event registration or ticket purchase.

Marketing cookies typically persist for ninety (90) days. We only set marketing cookies with your explicit consent, and you can withdraw that consent at any time through your cookie preferences or account settings. Disabling marketing cookies will not reduce the number of communications you see, but they may be less relevant to your interests.`
  },
  {
    id: "third-party",
    number: "7",
    title: "Third-Party Cookies",
    content: `When you use the EventKnit platform, certain third-party services may set their own cookies on your device. These cookies are governed by the respective third party's privacy and cookie policies, not by this Cookie Policy. We work with the following third-party services:

Google Analytics collects anonymized usage data to help us understand platform performance and user behavior. Stripe, our payment processor, sets cookies that are necessary for secure payment processing and fraud prevention. Social media platforms may set cookies if you use social sharing features on event pages or if you log in using a social account. These cookies enable the social platform to recognize you and may be used for their own purposes.

We carefully evaluate the third-party services we integrate with and select partners that demonstrate a commitment to user privacy and data protection. However, we do not control the cookies set by third parties and encourage you to review their respective privacy policies for more information.`
  },
  {
    id: "managing",
    number: "8",
    title: "Managing Your Cookie Preferences",
    content: `You have several options for managing how cookies are used when you visit EventKnit. We respect your choices and make it easy to adjust your preferences at any time.

Through your browser settings, most web browsers allow you to view, manage, and delete cookies. You can typically find cookie settings in your browser's privacy or security preferences. Note that blocking or deleting essential cookies may prevent the platform from functioning correctly, as features like authentication and secure checkout depend on them.

Through your account settings, if you have an EventKnit account, you can manage your cookie and data preferences directly in your account settings. This allows you to toggle functional, analytics, and marketing cookies on or off.

To opt out of analytics tracking specifically, you can install the Google Analytics opt-out browser extension, which prevents your data from being collected by Google Analytics on any website you visit.

We respect Do Not Track (DNT) signals sent by your browser. When we detect a DNT signal, we limit cookie usage to essential cookies only and do not set analytics or marketing cookies.

All marketing emails from EventKnit include an unsubscribe link that allows you to opt out of future marketing communications with a single click. This does not affect transactional emails related to your account or registrations.`
  },
  {
    id: "consent",
    number: "9",
    title: "Consent and Compliance",
    content: `If you are located in the European Union, the European Economic Area, the United Kingdom, or any other jurisdiction that requires prior consent for non-essential cookies (including under the GDPR and ePrivacy Directive), we will obtain your explicit consent before setting any non-essential cookies. You can manage your consent preferences at any time, and we will remember your choices for future visits.

By using the EventKnit platform, you consent to the use of essential cookies, as these are necessary for the platform to function. For all other cookies, we rely on your affirmative consent, which you provide through our cookie preference mechanisms.

We maintain records of cookie consent in compliance with applicable law, and we regularly review our cookie practices to ensure they align with evolving legal requirements and industry best practices.`
  },
  {
    id: "updates",
    number: "10",
    title: "Changes to This Cookie Policy",
    content: `We may update this Cookie Policy from time to time to reflect changes in the cookies we use, the third-party services we integrate with, or applicable legal requirements. When we make material changes, we will post the updated policy on this page with a revised "Last updated" date and, where appropriate, notify you through the platform or by email.

We encourage you to review this policy periodically to stay informed about how we use cookies and how you can manage your preferences.`
  },
  {
    id: "contact",
    number: "11",
    title: "Contact Us",
    content: `If you have questions or concerns about our use of cookies, or if you need assistance managing your cookie preferences, please contact us at privacy@eventknit.com. You can also reach our support team at support@eventknit.com or through the support section of the platform at eventknit.com/support.`
  }
];

const CookiePolicy = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>('');

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MinimalHeader />

      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2026</p>
          <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
            This policy explains how EventKnit uses cookies and similar technologies, what types of cookies we use, and how you can control your cookie preferences.
          </p>
        </div>
      </div>

      <div className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-12">

            <aside className="hidden lg:block w-64 flex-shrink-0">
              <nav className="sticky top-20">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contents</h3>
                <ul className="space-y-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={`block text-sm py-1 transition-colors ${
                          activeSection === section.id
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {section.number}. {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <div className="flex-1 min-w-0 max-w-4xl space-y-10">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-20"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-3">
                    {section.number}. {section.title}
                  </h2>
                  {section.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}

              <section className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Questions about cookies? Contact us at{' '}
                  <a href="mailto:privacy@eventknit.com" className="text-primary hover:underline">privacy@eventknit.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <LegalFooter />
    </div>
  );
};

export default CookiePolicy;
