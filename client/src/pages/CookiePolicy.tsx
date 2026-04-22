import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LegalPage from '@/components/legal/LegalPage';
import type { LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'what-are-cookies',
    title: '1. What Are Cookies',
    content: `Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, to remember your preferences, and to provide information to the site owners about how their site is being used.

Cookies can be "first-party" (set by the website you are visiting) or "third-party" (set by a service used by the website, such as an analytics or advertising provider). They can also be "session" cookies (deleted when you close your browser) or "persistent" cookies (stored on your device for a set period or until you manually delete them).

This Cookie Policy explains which cookies we use on the EventKnit platform, why we use them, and how you can manage your preferences. This policy should be read in conjunction with our Privacy Policy, which provides additional detail on how we handle your personal information.`,
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Cookies',
    content: `We use cookies and similar technologies for several important purposes:`,
    items: [
      'Enabling core functionality of the platform, such as keeping you logged in and processing secure transactions.',
      'Remembering your preferences and settings, such as your chosen language or interface theme.',
      'Understanding how you interact with the platform so we can improve the user experience.',
      'Measuring the effectiveness of our communications and marketing efforts.',
      'Providing security features that help protect your account and our platform from unauthorized access or fraudulent activity.',
    ],
    note: 'We only set non-essential cookies with your consent, and we provide clear mechanisms for you to manage your preferences at any time.',
  },
  {
    id: 'essential',
    title: '3. Essential Cookies',
    content: `Essential cookies are strictly necessary for the platform to operate. Without them, core features such as logging in, navigating, and completing transactions would not function. Because they are required, essential cookies cannot be disabled. They include:`,
    items: [
      'Authentication tokens — keep you securely logged in during your session.',
      'Session identifiers — maintain your browsing session and shopping cart state.',
      'CSRF tokens — protect against cross-site request forgery attacks.',
      'Load balancing cookies — distribute traffic across our servers for consistent performance.',
    ],
    note: 'These are usually session cookies that expire when you close your browser, though some authentication cookies may persist for up to thirty (30) days if you choose to remain logged in.',
  },
  {
    id: 'functional',
    title: '4. Functional Cookies',
    content: `Functional cookies enable the platform to remember choices you make and provide enhanced, personalized features. These cookies are not strictly necessary for the platform to operate, but they significantly improve your experience by remembering your settings and preferences.

Examples of functional cookies we use include theme preference cookies that remember whether you prefer a light or dark interface, language setting cookies that store your preferred language for displaying content, and notification preference cookies that remember how you want to receive alerts and updates.

Functional cookies typically persist for one (1) year from the date they are set, unless you clear them manually or withdraw your consent. Disabling functional cookies will not prevent you from using the platform, but you may need to re-enter your preferences each time you visit.`,
  },
  {
    id: 'analytics',
    title: '5. Analytics Cookies',
    content: `Analytics cookies help us understand how visitors interact with the EventKnit platform by collecting and reporting information about usage patterns. Where possible, we configure analytics tools to minimize personal data collection (for example, by using aggregation, pseudonymization, and data-retention controls). Analytics cookies help us identify which pages and features are most popular, understand how users navigate through the platform, detect technical issues such as broken links or slow-loading pages, and measure the effectiveness of changes and improvements we make.

We use Google Analytics as our primary analytics service. Google Analytics sets cookies (such as _ga and _gid) that collect information about your browsing behavior, including the pages you visit, how long you spend on each page, and how you arrived at the platform. This data is processed by Google in accordance with their privacy policy, which you can review at policies.google.com/privacy.

Analytics cookies typically persist for up to two (2) years. You can opt out of Google Analytics tracking by installing the Google Analytics opt-out browser extension, available at tools.google.com/dlpage/gaoptout.`,
  },
  {
    id: 'marketing',
    title: '6. Marketing Cookies',
    content: `Marketing cookies are used to deliver more relevant content and to measure the effectiveness of our marketing campaigns. These cookies track your activity across the platform and, in some cases, across other websites, to build a profile of your interests and show you content that is more likely to be relevant to you.

Our marketing cookies include recommendation identifiers that help us suggest events based on your browsing history and past registrations, campaign tracking cookies that help us understand which marketing channels drive the most engagement, and conversion tracking cookies that measure whether a marketing campaign led to an event registration or ticket purchase.

Marketing cookies typically persist for ninety (90) days. We only set marketing cookies with your explicit consent, and you can withdraw that consent at any time through your cookie preferences or account settings. Disabling marketing cookies will not reduce the number of communications you see, but they may be less relevant to your interests.`,
  },
  {
    id: 'third-party',
    title: '7. Third-Party Cookies',
    content: `When you use EventKnit, certain third-party services may set their own cookies on your device. These are governed by each third party's own privacy and cookie policies, not by this document. The services we work with include:`,
    subsections: [
      {
        subtitle: 'Google Analytics',
        items: ['Collects anonymized usage data to help us understand platform performance and user behavior.'],
      },
      {
        subtitle: 'Stripe',
        items: ['Sets cookies necessary for secure payment processing and fraud prevention.'],
      },
      {
        subtitle: 'Social Media Platforms',
        items: ["May set cookies if you use social sharing features on event pages or log in using a social account. These cookies may also be used for the platform's own purposes."],
      },
    ],
    note: 'We do not control cookies set by third parties. We encourage you to review their respective privacy policies for more information.',
  },
  {
    id: 'managing',
    title: '8. Managing Your Cookie Preferences',
    content: `You have several options for managing how cookies are used when you visit EventKnit. We make it easy to adjust your preferences at any time:`,
    subsections: [
      {
        subtitle: 'Browser Settings',
        items: ["Most web browsers let you view, manage, and delete cookies through your privacy or security preferences. Note that blocking essential cookies may prevent the platform from functioning correctly."],
      },
      {
        subtitle: 'Account Settings',
        items: ['If available for your account, you can manage functional, analytics, and marketing cookie preferences directly in your account settings or via our cookie preference prompt.'],
      },
      {
        subtitle: 'Google Analytics Opt-Out',
        items: ['Install the Google Analytics opt-out browser extension (tools.google.com/dlpage/gaoptout) to prevent your data from being collected by Google Analytics on any website you visit.'],
      },
      {
        subtitle: 'Do Not Track (DNT)',
        items: ['We respect DNT signals sent by your browser. When detected, we limit cookie usage to essential cookies only and do not set analytics or marketing cookies.'],
      },
      {
        subtitle: 'Marketing Emails',
        items: ['All marketing emails include a one-click unsubscribe link. This does not affect transactional emails related to your account or registrations.'],
      },
    ],
  },
  {
    id: 'consent',
    title: '9. Consent and Compliance',
    content: `If you are located in the European Union, the European Economic Area, the United Kingdom, or any other jurisdiction that requires prior consent for non-essential cookies (including under the GDPR and ePrivacy Directive), we will obtain your explicit consent before setting any non-essential cookies. You can manage your consent preferences at any time, and we will remember your choices for future visits.

By using the EventKnit platform, you consent to the use of essential cookies, as these are necessary for the platform to function. For all other cookies, we rely on your affirmative consent, which you provide through our cookie preference mechanisms.

We maintain records of cookie consent in compliance with applicable law, and we regularly review our cookie practices to ensure they align with evolving legal requirements and industry best practices.

Where a consent management tool is unavailable, you can still manage non-essential cookies through your browser settings and available opt-out tools.`,
  },
  {
    id: 'cookie-inventory',
    title: '10. Cookie Inventory (Summary)',
    content: `Below is a high-level summary of cookie categories we use. Specific cookie names may change over time as our services evolve or providers update their technologies:`,
    subsections: [
      {
        subtitle: 'Essential Cookies',
        items: ['Purpose: authentication, session continuity, security, and load balancing.', 'Typical duration: session or up to 30 days for persistent authentication preferences.'],
      },
      {
        subtitle: 'Functional Cookies',
        items: ['Purpose: remembering interface and preference settings (e.g., language or theme).', 'Typical duration: up to 1 year.'],
      },
      {
        subtitle: 'Analytics Cookies',
        items: ['Purpose: measuring usage patterns and platform performance.', 'Typical duration: up to 2 years, subject to provider settings and legal requirements.'],
      },
      {
        subtitle: 'Marketing Cookies',
        items: ['Purpose: campaign performance measurement and content relevance.', 'Typical duration: up to 90 days unless otherwise specified by the provider.'],
      },
    ],
  },
  {
    id: 'updates',
    title: '11. Changes to This Cookie Policy',
    content: `We may update this Cookie Policy from time to time to reflect changes in the cookies we use, the third-party services we integrate with, or applicable legal requirements. When we make material changes, we will post the updated policy on this page with a revised "Last updated" date and, where appropriate, notify you through the platform or by email.

We encourage you to review this policy periodically to stay informed about how we use cookies and how you can manage your preferences.`,
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: `If you have questions or concerns about our use of cookies, or if you need assistance managing your cookie preferences, please contact us at privacy@eventknit.com. You can also reach our support team at support@eventknit.com or through the support section of the platform at eventknit.com/support.`,
  },
];

const CookiePolicy = () => {
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
    <LegalPage
      title="Cookie Policy"
      subtitle="This policy explains how EventKnit uses cookies and similar technologies, what types of cookies we use, and how you can control your cookie preferences."
      lastUpdated="April 2026"
      contactEmail="privacy@eventknit.com"
      sections={sections}
    />
  );
};

export default CookiePolicy;
