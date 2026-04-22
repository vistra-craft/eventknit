import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LegalPage from '@/components/legal/LegalPage';
import type { LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: `This Privacy Policy explains how EventKnit ("we," "us," or "our") collects, uses, stores, shares, and protects your personal information when you use our platform, website, mobile application, and related services (the "Services"). We are committed to safeguarding your privacy and ensuring that your personal data is handled responsibly and in compliance with applicable data protection laws, including the Nigeria Data Protection Act (NDPA) 2023 and, where applicable, other international laws such as the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).

By using the Services, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our data practices, please discontinue use of the Services.`,
  },
  {
    id: 'who-we-are',
    title: '2. Who We Are',
    content: `EventKnit is an event technology platform that enables Organizers to create, manage, and promote events, and allows Attendees to discover, register for, and attend events. For the purposes of data protection law, EventKnit is the data controller for personal information collected through the platform.

Our Privacy Team can be reached at privacy@eventknit.com for any questions or concerns regarding your personal data. We are committed to responding to all privacy inquiries within two (2) business days.`,
  },
  {
    id: 'data-collection',
    title: '3. Personal Data We Collect',
    content: `We collect personal information in several ways, depending on how you interact with the Services. Understanding what we collect and why helps you make informed decisions about your use of our platform.

When you create an account, we collect your name, email address, and authentication credentials. If you sign up using a social login provider such as Google or Apple, we receive basic profile information from that provider, including your name and email address. During event registration, we may collect additional information as specified by the event Organizer, such as your phone number, dietary preferences, company name, job title, or other details relevant to the event.

Some registration fields (for example, dietary requirements) may reveal sensitive or special-category personal data (such as religious beliefs or health-related information). Where required by applicable law, we process such data only with your explicit consent and with additional safeguards.

When you make a purchase, our payment processor (currently Stripe) handles your payment card details directly. EventKnit does not store full credit card numbers on our servers. We do retain transaction records, including the amount paid, the payment method type, and the date of the transaction, for accounting and legal compliance purposes.

We also collect information automatically when you use the Services. This includes your IP address, device type and operating system, browser type and version, pages you visit and features you use, the dates and times of your visits, referring URLs, and general geographic location derived from your IP address. This information is collected through cookies, log files, and similar technologies as described in our Cookie Policy.`,
  },
  {
    id: 'lawful-basis',
    title: '4. Lawful Basis for Processing',
    content: `We process your personal data only when we have a valid legal basis to do so. Depending on the specific processing activity, we rely on one or more of the following grounds:`,
    subsections: [
      {
        subtitle: 'Contractual Necessity',
        items: [
          'Data necessary to perform our contract with you — creating your account, processing event registrations, facilitating ticket purchases, and providing customer support. Without this processing, we would be unable to deliver the Services.',
        ],
      },
      {
        subtitle: 'Consent',
        items: [
          'Where required by law, we obtain your explicit consent before processing your data for specific purposes, such as marketing communications, sharing data with event sponsors, or setting non-essential cookies.',
          'You may withdraw your consent at any time; this does not affect the lawfulness of processing that occurred before the withdrawal.',
        ],
      },
      {
        subtitle: 'Legitimate Interests',
        items: [
          'We may process your data for our legitimate business interests — fraud prevention, platform security, product improvement, and analytics — provided those interests are not overridden by your rights and freedoms.',
          'We conduct balancing tests to ensure our legitimate interests do not disproportionately impact your privacy.',
        ],
      },
      {
        subtitle: 'Legal Obligation',
        items: [
          'We process certain data to comply with legal and regulatory requirements, such as tax reporting, anti-money laundering regulations, and responding to lawful requests from public authorities.',
        ],
      },
      {
        subtitle: 'Vital Interests',
        items: [
          "In rare circumstances, we may process data to protect someone's life or physical safety, such as sharing emergency contact information with event safety personnel during a medical emergency.",
        ],
      },
    ],
  },
  {
    id: 'data-usage',
    title: '5. How We Use Your Data',
    content: `We use the personal information we collect for the following purposes, always in accordance with the lawful bases described above.

To provide and operate the Services, we use your data to create and manage your account, process event registrations and ticket purchases, generate and deliver tickets and QR codes, facilitate ticket transfers, and provide customer support. We also use your data to communicate with you about your account and registrations, including sending confirmation emails, event reminders, and updates about events you have registered for. These transactional communications are essential to the service and are not marketing messages.

To improve and personalize the Services, we analyze aggregated and anonymized usage data to understand how users interact with the platform, identify areas for improvement, and develop new features. We may use your event history and preferences to recommend events that may interest you, though you can opt out of personalized recommendations in your account settings.

To ensure security and prevent fraud, we use automated systems to detect and prevent unauthorized access, fraudulent transactions, ticket scalping, spam, and other abusive behavior. You have the right to know about automated decisions that significantly affect you and to request a manual review.

To comply with legal obligations, we retain and process certain data as required by applicable laws, including financial transaction records for tax and accounting purposes, and data necessary to respond to lawful requests from government authorities.`,
  },
  {
    id: 'data-sharing',
    title: '6. How We Share Your Data',
    content: `We do not sell your personal information. We share your data only in the following circumstances and with appropriate safeguards in place.

With event Organizers: When you register for an event, we share your registration information with the Organizer so they can manage your attendance. The specific data shared includes your name, email address, phone number (if provided), ticket type, registration answers, and check-in status. Once shared, the Organizer becomes an independent data controller for that information and is responsible for handling it in accordance with their own privacy policy and applicable law. We encourage you to review the Organizer's privacy practices before registering for their events.

With service providers: We work with trusted third-party service providers who process data on our behalf to deliver the Services. These include Stripe for payment processing, email delivery services for transactional and marketing communications, cloud infrastructure providers for hosting and data storage, and analytics services for understanding platform usage. All service providers are bound by data processing agreements that require them to protect your data and use it only for the purposes we specify.

With your consent: If you opt in, we may share your information with event sponsors or partners for marketing purposes. This sharing is always based on your explicit consent, which you can withdraw at any time.

For legal reasons: We may disclose your information if we believe in good faith that disclosure is necessary to comply with applicable law, regulation, or legal process; to respond to lawful requests from public authorities, including law enforcement; to protect the rights, property, or safety of EventKnit, our users, or the public; or to enforce our Terms of Service.

Corporate transactions: If EventKnit is involved in a merger, acquisition, financing, reorganization, sale of assets, bankruptcy, or similar transaction, your information may be transferred as part of that transaction, subject to appropriate confidentiality and legal safeguards.

We never sell your personal information to third parties for their marketing purposes.`,
  },
  {
    id: 'data-retention',
    title: '7. Data Retention',
    content: `We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable law. The specific retention periods depend on the type of data and the reason for its collection.

Active account data is retained for as long as you maintain an account with EventKnit. If you close your account or request deletion, we will delete or anonymize your personal data within thirty (30) days, except where longer retention is required by law or necessary for legitimate business purposes such as dispute resolution.

Financial and transaction records are retained for seven (7) years following the transaction, as required for tax, accounting, and legal compliance purposes. During this period, transaction data is maintained in a restricted-access environment and is not used for marketing or other unrelated purposes.

Transactional email records are retained for two (2) years to support customer service inquiries and dispute resolution. Event registration data is retained for the duration of the event and for up to twelve (12) months afterward to support follow-up communications, feedback collection, compliance checks, and dispute resolution.

You may request permanent deletion of your data at any time by contacting us at privacy@eventknit.com or by using the data deletion feature in your account settings.`,
  },
  {
    id: 'data-security',
    title: '8. Data Security',
    content: `We take the security of your personal data seriously and implement appropriate technical and organizational measures to protect it against unauthorized access, alteration, disclosure, or destruction.

Our security measures include encryption of data in transit using TLS/SSL protocols, encryption of sensitive data at rest, secure authentication mechanisms including multi-factor authentication support, regular security assessments and vulnerability testing, access controls that limit employee access to personal data on a need-to-know basis, and monitoring systems that detect and alert us to suspicious activity.

Despite our efforts, no method of transmission over the internet or method of electronic storage is completely secure. We cannot guarantee absolute security, but we are committed to promptly addressing any security incidents. In the event of a data breach that poses a risk to your rights and freedoms, we will notify the relevant supervisory authority within seventy-two (72) hours and will notify affected individuals without undue delay, in accordance with applicable data protection laws.`,
  },
  {
    id: 'international-transfers',
    title: '9. International Data Transfers',
    content: `Your personal data may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from the laws of your jurisdiction. When we transfer your data internationally, we ensure that appropriate safeguards are in place to protect your information.

These safeguards may include standard contractual clauses approved by relevant authorities, data processing agreements with recipients that impose obligations equivalent to those in this Privacy Policy, transfers to countries that have been determined to provide an adequate level of data protection, and your explicit consent where required by applicable law.

We regularly review and update our transfer mechanisms to ensure they remain compliant with evolving legal requirements and provide meaningful protection for your data.`,
  },
  {
    id: 'your-rights',
    title: '10. Your Rights',
    content: `Depending on your location and applicable law, you may have some or all of the following rights regarding your personal data. We are committed to honoring these rights within the timeframes required by law.`,
    subsections: [
      {
        subtitle: 'Right of Access',
        items: ['Request a copy of the personal data we hold about you, along with information about how we process it. Exercisable through your account settings or by contacting us directly.'],
      },
      {
        subtitle: 'Right to Rectification',
        items: ['If any personal data is inaccurate or incomplete, request that we correct or update it. Most information can be updated directly through your account settings.'],
      },
      {
        subtitle: 'Right to Erasure',
        items: ['Request deletion of your personal data, subject to legal retention requirements. We will delete or anonymize your data within thirty (30) days, except where legally required to retain it.'],
      },
      {
        subtitle: 'Right to Data Portability',
        items: ['Receive your personal data in a structured, machine-readable format and transmit it to another provider. Export your data through your account settings or by contacting us.'],
      },
      {
        subtitle: 'Right to Restrict Processing',
        items: ['Request that we restrict processing of your data in certain circumstances, such as when you contest its accuracy or object to processing based on legitimate interests.'],
      },
      {
        subtitle: 'Right to Object',
        items: ['Object to processing of your data for direct marketing at any time. You may also object to processing based on legitimate interests; we will cease unless we demonstrate compelling legitimate grounds.'],
      },
      {
        subtitle: 'Right to Withdraw Consent',
        items: ['Where we rely on consent to process your data, you may withdraw it at any time. This does not affect the lawfulness of processing carried out before the withdrawal.'],
      },
      {
        subtitle: 'Right to Lodge a Complaint',
        items: ['If you believe our processing violates applicable law, you may lodge a complaint with the Nigeria Data Protection Commission (NDPC) or the relevant supervisory authority in your jurisdiction.'],
      },
    ],
    note: 'To exercise any of these rights, contact our Privacy Team at privacy@eventknit.com. We will verify your identity before processing your request and respond within thirty (30) days.',
  },
  {
    id: 'children',
    title: '11. Children\'s Privacy',
    content: `The Services are not intended for individuals under the age of eighteen (18), or under the age of legal majority in their jurisdiction. We do not knowingly collect personal data from children under these ages. If we become aware that we have inadvertently collected personal data from a child, we will take steps to delete that information as promptly as possible.

If you are a parent or guardian and believe that your child has provided personal data to EventKnit without your consent, please contact us at privacy@eventknit.com, and we will work to remove that information from our systems.`,
  },
  {
    id: 'automated-decisions',
    title: '12. Automated Decision-Making',
    content: `We use automated systems to support certain aspects of the Services, including fraud detection and prevention, event recommendations based on your interests and past activity, spam and abuse prevention, and risk assessment for transactions.

These automated processes may influence your experience on the platform, such as flagging potentially fraudulent transactions for review or personalizing the events shown to you. We do not make fully automated decisions that produce significant legal effects concerning you without human oversight.

You have the right to know about automated decisions that affect you and to request manual review of any decision made by automated means. To exercise this right, contact us at privacy@eventknit.com.`,
  },
  {
    id: 'processors',
    title: '13. Data Processors and Partners',
    content: `We work with trusted third-party service providers who process personal data on our behalf. All providers are contractually bound to protect your data and use it only for the purposes we authorize. Our key data processors include:`,
    subsections: [
      {
        subtitle: 'Stripe (Payment Processing)',
        items: ["Handles payment card information and transaction processing in accordance with PCI-DSS standards. Review Stripe's privacy practices at privacy.stripe.com."],
      },
      {
        subtitle: 'Amazon Web Services (Cloud Infrastructure)',
        items: ['Provides hosting, data storage, and computing services. AWS processes data in accordance with their data processing addendum and maintains compliance with major security and privacy frameworks.'],
      },
      {
        subtitle: 'Email Delivery Services',
        items: ['Used for transactional communications (registration confirmations, ticket deliveries, event updates) and marketing communications where you have opted in.'],
      },
      {
        subtitle: 'Google Analytics',
        items: ["Collects anonymized and aggregated usage data to help us improve the user experience. Review Google's privacy practices at policies.google.com/privacy."],
      },
    ],
    note: 'We maintain an up-to-date list of sub-processors and conduct regular assessments to ensure they meet our data protection standards.',
  },
  {
    id: 'organizer-data',
    title: '14. Organizer Access to Attendee Data',
    content: `When you register for an event, certain personal data is shared with the event Organizer to enable them to manage the event and your attendance. It is important to understand the scope of this data sharing and the respective responsibilities of EventKnit and the Organizer.

The data shared with Organizers typically includes your name, email address, phone number (if provided during registration), ticket type and registration status, responses to custom registration questions set by the Organizer, check-in status and attendance data, and any information you voluntarily provide through event-specific forms or communications.

Once your data is shared with an Organizer, the Organizer becomes an independent data controller for that data. This means the Organizer is responsible for determining how they use your data beyond the scope of the event, maintaining their own privacy policy that governs their use of attendee data, complying with applicable data protection laws in their jurisdiction, and responding to data subject rights requests related to data in their possession.

As a condition of using EventKnit, Organizers are required to agree to contractual terms that require lawful handling of attendee data, implementation of appropriate security controls, and cooperation with applicable data protection requirements.

EventKnit is not responsible for the privacy practices of Organizers. We encourage you to review the Organizer's privacy policy before registering for their event. If you have concerns about how an Organizer is handling your data, you should contact them directly and, if necessary, exercise your rights under applicable data protection law.`,
  },
  {
    id: 'marketing',
    title: '15. Marketing Communications',
    content: `We distinguish between transactional communications and marketing communications. Transactional communications include registration confirmations, ticket deliveries, event reminders, account notifications, and security alerts. These are essential to the operation of the Services and are sent regardless of your marketing preferences.

Marketing communications include event recommendations, promotional offers, newsletters, and partner communications. We will only send you marketing communications if you have given your explicit consent, such as by checking the marketing opt-in box during registration or in your account settings. You can withdraw your consent and unsubscribe from marketing communications at any time by clicking the unsubscribe link in any marketing email, updating your preferences in your account settings, or contacting us at privacy@eventknit.com.

If an event Organizer wishes to send you marketing communications, they must obtain your separate consent. During event registration, you may be presented with an option to receive marketing emails from the Organizer. This consent is separate from your consent to receive communications from EventKnit, and you can manage each independently.`,
  },
  {
    id: 'updates',
    title: '16. Changes to This Privacy Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our data practices, legal requirements, or business operations. When we make material changes, we will notify you by posting the updated policy on this page with a revised "Last updated" date, and where appropriate, by sending you an email notification or displaying a notice within the platform.

We encourage you to review this Privacy Policy periodically to stay informed about how we protect your data. Your continued use of the Services after changes to this Privacy Policy constitutes your acceptance of the updated terms. If you do not agree with any changes, you should discontinue use of the Services and close your account.`,
  },
  {
    id: 'contact',
    title: '17. Contact Us',
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, reach us through any of the following channels:`,
    items: [
      'Privacy inquiries & data subject requests: privacy@eventknit.com',
      'General support: support@eventknit.com',
      'Legal matters: legal@eventknit.com',
      'Support section: eventknit.com/support',
    ],
    note: 'Our Privacy Team aims to respond within two (2) business days and to resolve data subject requests within thirty (30) days. If you are not satisfied with our response, you have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) or the relevant supervisory authority in your jurisdiction.',
  },
];

const PrivacyPolicy = () => {
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
      title="Privacy Policy"
      subtitle="This policy describes how EventKnit collects, uses, stores, and protects your personal information. We are committed to transparency and to safeguarding your privacy."
      lastUpdated="April 2026"
      contactEmail="privacy@eventknit.com"
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
