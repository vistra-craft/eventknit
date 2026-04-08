import LegalPage from '@/components/legal/LegalPage';
import type { LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    title: 'What Are Cookies',
    content: 'Cookies are small text files stored on your device when you visit our site. They help us remember your preferences and understand how you use EventKnit.',
  },
  {
    title: 'Essential Cookies',
    content: 'Required for the site to work. Login, checkout, security.',
    items: [
      'auth_token — session authentication',
      'session_id — session management',
      'csrf_token — security protection',
    ],
    note: 'Duration: Until logout or 30 days. These cannot be disabled.',
  },
  {
    title: 'Functional Cookies',
    content: 'Remember your preferences like language and theme.',
    items: [
      'theme_preference — light/dark mode',
      'language_setting — language choice',
    ],
    note: 'Duration: 1 year.',
  },
  {
    title: 'Analytics Cookies',
    content: 'Help us understand how you use the site to make it better.',
    items: [
      '_ga (Google Analytics) — usage tracking',
      '_gid — session identification',
    ],
    note: 'Duration: 2 years.',
  },
  {
    title: 'Marketing Cookies',
    content: 'Used for personalized recommendations and ads.',
    items: [
      'recommendation_id — event suggestions',
      'campaign_tracking — marketing attribution',
    ],
    note: 'Duration: 90 days.',
  },
  {
    title: 'Third-Party Services',
    content: 'We work with trusted services that may set their own cookies:',
    items: [
      'Google Analytics (usage data)',
      'Stripe (payment processing)',
      'Social platforms (sharing features)',
    ],
  },
  {
    title: 'Managing & Opting Out',
    content: 'You can control cookies through your browser settings. Note that disabling essential cookies may affect site functionality like staying logged in.',
    items: [
      'Browser Cookie Settings: Most browsers have privacy controls for cookies',
      'Opt-Out of Analytics: Use Google Analytics opt-out browser extension',
      'Opt-Out of Marketing: Unsubscribe links in all marketing emails',
      'Do Not Track (DNT): We respect browser DNT signals',
      'Cookie Preferences: Manage your choices anytime in account settings',
    ],
  },
  {
    title: 'Consent & GDPR Compliance',
    content: "If you're in the EU or a jurisdiction with similar laws (GDPR/ePrivacy), we obtain your explicit consent before setting non-essential cookies. You can manage your preferences anytime. By using EventKnit, you consent to our use of essential and functional cookies.",
  },
  {
    title: 'Updates',
    content: "We may update this policy as our practices change. We'll notify you of significant changes.",
  },
];

const CookiePolicy = () => {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="What cookies we use, why, and how you can control them."
      lastUpdated="January 2025"
      contactEmail="privacy@eventknit.com"
      sections={sections}
    />
  );
};

export default CookiePolicy;
