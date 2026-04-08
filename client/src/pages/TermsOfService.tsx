import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LegalPage from '@/components/legal/LegalPage';
import type { LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    title: 'Acceptance',
    content: "By using EventKnit, you agree to these terms. If you don't agree, please don't use our service.",
  },
  {
    title: 'What We Provide',
    content: 'EventKnit connects event organizers with attendees. Organizers can create events, sell tickets, and manage registrations. Attendees can discover events, purchase tickets, and receive updates.',
  },
  {
    title: 'Your Account',
    items: [
      'Keep your login credentials secure',
      'Provide accurate information',
      "You're responsible for activity on your account",
      'Notify us of unauthorized access',
    ],
  },
  {
    title: 'Prohibited Use',
    items: [
      'Illegal content or activities',
      'Spam or harassment',
      'Copyright infringement',
      'Attempting to hack or disrupt the platform',
    ],
  },
  {
    title: 'Payments',
    content: 'Payments are processed securely through trusted partners. Service fees are displayed before purchase and are generally non-refundable.',
  },
  {
    id: 'refund-policy',
    title: 'Refunds',
    items: [
      'Cancel up to 24 hours before the event for a full refund',
      "Transfer tickets if you can't attend",
      'Full refund if the event is cancelled by the organizer',
      'Refunds processed within 5-7 business days',
    ],
  },
  {
    title: 'Liability',
    content: 'EventKnit provides services "as is". We\'re not liable for event cancellations, incorrect organizer information, or temporary service disruptions. Our liability is limited to the amount you paid for the service.',
  },
  {
    title: 'Termination',
    content: 'Either party can end this agreement. You can access your data for 30 days after termination. We may suspend accounts that violate these terms.',
  },
  {
    title: 'Changes',
    content: 'We may update these terms and will notify you of significant changes. Continued use means you accept the updates.',
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property Rights',
    content: 'EventKnit owns all platform content, design, and functionality. Users retain ownership of their event content. By uploading content, you grant us a license to display and distribute it on the platform.',
  },
  {
    title: 'User-Generated Content',
    items: [
      "You're responsible for content you upload",
      'You grant us the right to use your event information for platform operation',
      'We may remove content that violates these terms',
      'Photos and reviews may be displayed publicly',
    ],
  },
  {
    title: 'Disclaimer of Warranties',
    content: "EventKnit is provided 'as is' without warranties. We don't guarantee uninterrupted service, accurate information from organizers, or that events will proceed as planned. Use at your own risk.",
  },
  {
    title: 'Force Majeure',
    content: 'EventKnit is not liable for failures due to events beyond our control (natural disasters, war, pandemics, infrastructure failures).',
  },
  {
    id: 'dispute-resolution',
    title: 'Dispute Resolution',
    items: [
      'First, try to resolve disputes by contacting us at support@eventknit.com',
      'If unresolved after 30 days, disputes are resolved through binding arbitration',
      'Both parties waive the right to jury trial or class action lawsuits',
      'Arbitration occurs in accordance with applicable laws',
    ],
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: 'These terms are governed by the laws of Nigeria, without regard to conflict of law principles. Any disputes shall be resolved under Nigerian law.',
  },
  {
    title: 'Severability',
    content: 'If any provision of these terms is found invalid or unenforceable, that provision shall be removed, and the remaining terms shall continue in full effect.',
  },
];

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
    <LegalPage
      title="Terms of Service"
      subtitle="The rules that govern your use of the EventKnit platform."
      lastUpdated="January 2025"
      contactEmail="legal@eventknit.com"
      sections={sections}
    />
  );
};

export default TermsOfService;
