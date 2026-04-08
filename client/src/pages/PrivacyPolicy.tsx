import LegalPage from '@/components/legal/LegalPage';
import type { LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    title: 'What We Collect',
    subsections: [
      {
        subtitle: 'Information you provide',
        items: ['Name and email', 'Payment details (processed by secure partners)', 'Event preferences'],
      },
      {
        subtitle: 'Collected automatically',
        items: ['Device and browser info', 'IP address', 'Pages visited'],
      },
    ],
  },
  {
    title: 'How We Use It',
    items: [
      'Process registrations and payments',
      'Send event updates and confirmations',
      'Improve the platform',
      'Prevent fraud',
    ],
  },
  {
    title: 'Who We Share With',
    items: [
      'Event organizers (to facilitate your attendance)',
      'Payment processors (Stripe, etc.)',
      'Analytics services',
      'When required by law',
    ],
    note: 'We never sell your personal information.',
  },
  {
    title: 'Your Rights',
    items: [
      'Access your data',
      'Correct inaccurate information',
      'Request deletion',
      'Withdraw consent',
    ],
  },
  {
    title: 'Security',
    content: 'We use SSL encryption, secure storage, and regular security audits to protect your data.',
  },
  {
    title: 'Updates',
    content: 'We may update this policy and will notify you of significant changes. Continued use means acceptance.',
  },
  {
    title: 'Data Retention',
    items: [
      'Active account data is kept while you use EventKnit',
      'After account deletion, we retain data for 30 days (for dispute resolution)',
      'Payment records retained for 7 years (legal/tax compliance)',
      'Transactional emails retained for 2 years',
      'You can request permanent deletion anytime',
    ],
  },
  {
    title: 'Your Privacy Rights (GDPR/CCPA)',
    items: [
      'Right to Access: Request a copy of your data anytime',
      'Right to Correction: Update inaccurate information',
      'Right to Deletion: Request we delete your account and personal data',
      'Right to Data Portability: Get your data in a portable format',
      'Right to Withdraw Consent: Opt-out of marketing emails anytime',
      'Right to Object: Reject processing for non-essential purposes',
      'Contact privacy@eventknit.com to exercise any right',
    ],
  },
  {
    title: "Children's Privacy",
    content: "EventKnit is not intended for users under 18. We don't knowingly collect data from minors. If we discover we have, we will delete it immediately. Parents/guardians concerned about a child's data should contact us.",
  },
  {
    title: 'International Data Transfers',
    content: 'Your data may be transferred to, stored in, and processed in countries other than your country of residence. By using EventKnit, you consent to data transfer and processing in these jurisdictions.',
  },
  {
    title: 'Automated Decision-Making',
    content: 'We use automated systems to detect fraud, recommend events, and prevent abuse. You have the right to know about automated decisions affecting you and can request manual review.',
  },
  {
    title: 'Data Processors & Partners',
    items: [
      'Stripe (payment processing) - privacy.stripe.com',
      'Google Analytics (analytics) - policies.google.com/privacy',
      'SendGrid (email) - sendgrid.com/resource/gdpr',
      'AWS (hosting) - aws.amazon.com/privacy',
      'We ensure all partners comply with data protection laws',
    ],
  },
];

const PrivacyPolicy = () => {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated="January 2025"
      contactEmail="privacy@eventknit.com"
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
