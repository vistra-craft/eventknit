import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LegalPage from '@/components/legal/LegalPage';
import type { LegalSection } from '@/components/legal/LegalPage';

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using the EventKnit platform, website, mobile application, or any associated services (collectively, the "Services"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you are using the Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms, and references to "you" shall include both you individually and the organization you represent.

You must be at least 18 years of age, or the age of legal majority in your jurisdiction, to create an account or use our Services. If you are between 13 and 18 years of age, you may only use the Services with the consent and supervision of a parent or legal guardian who agrees to be bound by these Terms. We do not knowingly allow individuals under 13 to use the Services.

If you do not agree to these Terms, you must discontinue use of the Services immediately. For material changes, we will provide at least fourteen (14) days' prior notice (unless a shorter period is required for legal, security, or abuse-prevention reasons). Your continued use of EventKnit after the effective date of revised Terms constitutes acceptance of those revisions.`,
  },
  {
    id: 'services',
    title: '2. Description of Services',
    content: `EventKnit is an event technology platform that connects event organizers ("Organizers") with attendees ("Attendees"). Our Services enable Organizers to create, promote, and manage events, sell tickets, process registrations, and communicate with participants. Attendees can discover events, purchase tickets, manage their registrations, and engage with event content.

EventKnit acts as an intermediary platform and marketplace. We are not the organizer, host, or producer of any event listed on our platform unless explicitly stated otherwise. The contractual relationship for event attendance is between you and the Organizer. EventKnit facilitates this relationship by providing technology infrastructure, payment processing, and communication tools, but we do not control and are not responsible for the actions, omissions, quality, safety, legality, or any other aspect of events listed on the platform.

We reserve the right to modify, suspend, or discontinue any part of the Services at any time. Where reasonably practicable, we will provide advance notice of significant changes that affect your use of the platform.`,
  },
  {
    id: 'accounts',
    title: '3. Account Registration and Security',
    content: `To access certain features of the Services, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account, whether or not you have authorized them. You agree to notify us immediately at support@eventknit.com if you suspect any unauthorized access to or use of your account.

You may not share your account credentials with any third party, create multiple accounts for deceptive purposes, or use another person's account without their express permission. We reserve the right to suspend or terminate accounts that we reasonably believe have been compromised, are being used fraudulently, or are in violation of these Terms.

EventKnit supports authentication through email verification, social login providers (such as Google and Apple), and other methods we may introduce. You are responsible for maintaining the security of any authentication method linked to your account.`,
  },
  {
    id: 'organizer-terms',
    title: '4. Organizer Responsibilities',
    content: `If you use EventKnit as an Organizer, you accept additional responsibilities beyond those of a general user. You are solely responsible for the accuracy of all event information you publish, including but not limited to event descriptions, dates, times, locations, pricing, age restrictions, accessibility accommodations, and any applicable terms or policies specific to your event.

You represent and warrant that you have all necessary rights, licenses, permits, and authorizations required to host your event and to use any content (including images, logos, and descriptions) that you upload to the platform. You agree to comply with all applicable local, national, and international laws and regulations related to your event, including health and safety requirements, venue regulations, licensing requirements, and consumer protection laws.

As an Organizer, you are the primary party responsible for the delivery of the event experience. This includes, but is not limited to, venue safety, event quality, performer or speaker appearances, schedule adherence, and attendee satisfaction. EventKnit shall not be held liable for any failure on the part of an Organizer to deliver the event as advertised.

You agree to handle attendee data shared with you through the platform in accordance with applicable data protection laws. You acknowledge that you become an independent data controller for any attendee information you receive and that you must maintain your own privacy policy governing your use of that data.`,
  },
  {
    id: 'attendee-terms',
    title: '5. Attendee Responsibilities',
    content: `As an Attendee, you agree to provide accurate personal information when registering for events. You understand that your registration information, including your name, email address, and any additional details collected through the registration form, will be shared with the event Organizer to facilitate your attendance. The Organizer may use this information in accordance with their own privacy policy, which is separate from the EventKnit Privacy Policy.

You are responsible for reviewing all event details, including date, time, location, requirements, and the Organizer's specific terms and refund policies, before completing your registration. EventKnit displays this information as provided by Organizers and cannot guarantee its accuracy or completeness.

You agree to comply with all venue rules, event guidelines, and applicable laws when attending events. EventKnit is not responsible for any disputes between you and an Organizer regarding event access, quality, or experience.`,
  },
  {
    id: 'payments',
    title: '6. Payments, Fees, and Pricing',
    content: `EventKnit processes payments securely through trusted third-party payment processors, including Stripe and other providers we may use from time to time. By making a purchase on our platform, you agree to the terms of the applicable payment processor in addition to these Terms.

All prices displayed on the platform are set by Organizers and are shown in the applicable currency. EventKnit may charge service fees on ticket purchases, which will be clearly displayed before you complete your transaction. These service fees compensate EventKnit for providing the platform, payment processing, and related services and are non-refundable except where required by applicable law or where EventKnit determines a refund is necessary due to a platform error.

Organizers are responsible for determining ticket prices, applicable taxes, and any additional fees. EventKnit does not control pricing decisions made by Organizers and is not responsible for errors in pricing set by Organizers. If you believe you have been charged incorrectly, please contact us at support@eventknit.com.

For Organizers receiving payouts, EventKnit will transfer funds in accordance with the payout schedule and terms agreed upon during account setup. EventKnit reserves the right to withhold payouts if there is a reasonable suspicion of fraud, a high volume of refund requests, or a dispute regarding the event.`,
  },
  {
    id: 'refunds',
    title: '7. Refunds and Cancellations',
    content: `Refund policies are set by individual Organizers and are displayed on each event page before registration. EventKnit provides the technical infrastructure for ticketing and payment facilitation, but the Organizer is primarily responsible for defining and honoring their event refund policy. You should review the applicable refund policy before completing your purchase.

  If an Organizer cancels an event, the Organizer is responsible for initiating attendee refunds in accordance with their policy and applicable law. Once authorized by the Organizer (or otherwise required by law), EventKnit and its payment partners will facilitate technical refund processing. Processing timelines may vary by payment method, bank, and region.

  If an event is postponed rather than cancelled, the Organizer may honor existing tickets for the new date. If you are unable to attend the rescheduled event, refund eligibility is determined by the Organizer's policy and applicable law.

  Service fees charged by EventKnit are non-refundable except where required by applicable law or where EventKnit determines a refund is necessary due to platform error, duplicate charge, fraud response, or other exceptional circumstances. For refund requests, contact the Organizer first through the platform. If your issue relates to a platform billing error, contact support@eventknit.com.`,
  },
  {
    id: 'transfers',
    title: '8. Ticket Transfers',
    content: `EventKnit provides ticket transfer functionality that allows Attendees to transfer their tickets to another person, subject to the Organizer's transfer policy. Not all events permit ticket transfers, and Organizers may disable this feature at their discretion.

When you transfer a ticket, the recipient will receive a new ticket associated with their information. The original ticket will be invalidated. You remain responsible for any transactions associated with the original purchase, and the transfer does not create any obligation on EventKnit's part toward the recipient beyond the standard terms of service.

Transferred tickets may not be re-transferred unless the Organizer's policy explicitly allows it. EventKnit does not facilitate or endorse the resale of tickets above face value. Any attempt to resell tickets through unauthorized channels may result in the cancellation of those tickets without refund.`,
  },
  {
    id: 'prohibited',
    title: '9. Prohibited Conduct',
    content: `You agree not to use the Services for any purpose that is unlawful, harmful, or in violation of these Terms. The following activities are specifically prohibited:`,
    items: [
      "Creating events that are fraudulent, misleading, or designed to deceive attendees about the nature, quality, or existence of the event.",
      "Uploading content that infringes the intellectual property rights of any third party, or that is defamatory, obscene, threatening, or otherwise objectionable.",
      "Using automated tools, bots, scrapers, or other software to access the Services, purchase tickets in bulk, or circumvent any security or rate-limiting measures we employ.",
      "Engaging in ticket scalping, unauthorized resale above face value, or any scheme to artificially inflate ticket demand or prices.",
      "Attempting to gain unauthorized access to other users' accounts, our servers, or any systems connected to the Services.",
      "Harassing, threatening, or intimidating other users, Organizers, or EventKnit staff through the platform.",
      "Manipulating reviews, ratings, or feedback systems.",
      "Using the platform to distribute malware, spam, or phishing content.",
      "Circumventing or disabling any technological measures we use to protect the Services or enforce these Terms.",
    ],
    note: 'We reserve the right to investigate and take appropriate action against violators, including removing content, suspending or terminating accounts, reporting activity to law enforcement, and pursuing legal remedies.',
  },
  {
    id: 'ip',
    title: '10. Intellectual Property',
    content: `All content, design, graphics, logos, trademarks, software, and technology that comprise the EventKnit platform are owned by or licensed to EventKnit and are protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Services for their intended purpose, subject to these Terms.

You retain ownership of any content you upload to the platform, including event descriptions, images, and other materials. By uploading content, you grant EventKnit a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute that content in connection with operating and promoting the Services. This license continues for as long as your content remains on the platform and for a reasonable period after removal to account for caching and archival processes.

You represent and warrant that you have the right to grant this license for any content you upload, and that such content does not infringe the rights of any third party. EventKnit reserves the right to remove any content that we believe, in our sole discretion, violates these Terms or applicable law.`,
  },
  {
    id: 'indemnification',
    title: '11. Indemnification',
    content: `You agree to indemnify, defend, and hold harmless EventKnit, its officers, directors, employees, agents, and affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney fees) arising out of or related to:`,
    items: [
      'Your use of the Services.',
      'Your violation of these Terms.',
      'Your violation of any applicable law or regulation.',
      'Your breach of any representation or warranty made herein.',
      'Any content you upload, publish, or transmit through the Services.',
      'Any event you organize, host, or attend through the platform.',
      'Any dispute between you and any other user or third party.',
    ],
    note: 'This indemnification obligation shall survive the termination of your account and these Terms.',
  },
  {
    id: 'liability',
    title: '12. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EVENTKNIT AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

IN NO EVENT SHALL EVENTKNIT'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICES EXCEED THE GREATER OF (A) THE AMOUNTS YOU HAVE PAID TO EVENTKNIT IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, (B) ONE HUNDRED US DOLLARS (USD $100), OR (C) ANY MINIMUM AMOUNT REQUIRED BY APPLICABLE LAW.

SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE EXCLUSIONS OR LIMITATIONS MAY NOT APPLY, AND YOU MAY HAVE ADDITIONAL RIGHTS.`,
  },
  {
    id: 'disclaimers',
    title: '13. Disclaimers',
    content: `THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. EVENTKNIT EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

EVENTKNIT DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR RELIABILITY OF ANY CONTENT ON THE PLATFORM, INCLUDING EVENT LISTINGS, ORGANIZER INFORMATION, USER REVIEWS, OR THIRD-PARTY CONTENT.

EventKnit does not endorse any event, Organizer, or Attendee on the platform. Any interactions, transactions, or disputes between users are solely between those parties. We encourage you to exercise judgment and due diligence when using the Services.`,
  },
  {
    id: 'dispute-resolution',
    title: '14. Dispute Resolution',
    content: `If you have a dispute arising out of or relating to these Terms or the Services, we encourage you to first contact us at support@eventknit.com to attempt an informal resolution. We will make a good-faith effort to resolve any dispute within thirty (30) days of receiving your written notice.

If we are unable to resolve the dispute informally, both parties agree that any remaining dispute, controversy, or claim shall be resolved through binding arbitration in accordance with the Arbitration and Mediation Act 2023 of Nigeria (as amended or replaced from time to time), rather than in court. To the extent permitted by applicable law, both parties waive any right to a jury trial and any right to participate in a class, collective, or representative proceeding.

The arbitration shall be conducted by a single arbitrator in Lagos, Nigeria, and the language of the arbitration shall be English. The arbitrator's decision shall be final and binding, and judgment on the award may be entered in any court of competent jurisdiction.

Notwithstanding the above, either party may seek injunctive or equitable relief in any court of competent jurisdiction to protect its intellectual property rights or to prevent irreparable harm.`,
  },
  {
    id: 'governing-law',
    title: '15. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles. Any legal proceedings not subject to arbitration under Section 14 shall be brought exclusively in the courts located in Lagos, Nigeria, and you consent to the personal jurisdiction of such courts.

If you are accessing the Services from outside Nigeria, you are responsible for compliance with any applicable local laws. The Services are not intended for use in any jurisdiction where such use would be contrary to local law or regulation.`,
  },
  {
    id: 'termination',
    title: '16. Termination',
    content: `Either you or EventKnit may terminate your account and these Terms at any time. You may close your account by contacting us at support@eventknit.com or through your account settings. Upon termination, your right to use the Services will cease immediately.

EventKnit may suspend or terminate your account if we reasonably believe you have violated these Terms, engaged in fraudulent activity, or pose a risk to other users or the platform. We will make reasonable efforts to notify you of the reason for suspension or termination, except where doing so would compromise the safety or security of the platform or other users.

Following account termination, we will retain your data for thirty (30) days to allow you to request a copy or to restore your account. After this period, your personal data will be deleted or anonymized in accordance with our Privacy Policy. Certain data, such as transaction records, may be retained for longer periods as required by applicable law.

Termination does not release either party from obligations accrued prior to termination, including payment obligations, indemnification duties, and any claims arising from events that occurred before the account was closed.`,
  },
  {
    id: 'force-majeure',
    title: '17. Force Majeure',
    content: `EventKnit shall not be liable for any failure or delay in performing its obligations under these Terms where such failure or delay arises from causes beyond our reasonable control. These causes include, but are not limited to, natural disasters, pandemics, epidemics, acts of war or terrorism, government actions or regulations, power failures, internet or telecommunications outages, cyberattacks, labor disputes, and infrastructure failures.

In the event of a force majeure occurrence, EventKnit will make reasonable efforts to resume performance as soon as practicable and will notify affected users of any significant disruptions to the Services.`,
  },
  {
    id: 'changes',
    title: '18. Changes to These Terms',
    content: `We may update these Terms from time to time to reflect changes in our Services, legal requirements, or business practices. When we make material changes, we will post the updated Terms on this page with a revised "Last updated" date and provide notice by email and/or in-product notification where reasonably practicable.

  Unless a shorter period is required for legal, security, or abuse-prevention reasons, material changes will become effective no earlier than fourteen (14) days after notice is provided. If you do not agree with the updated Terms, you should discontinue your use of the Services and close your account before the effective date.

  Your continued use of the Services after the effective date of the updated Terms constitutes acceptance of those Terms.

  We encourage you to review these Terms periodically to stay informed of your rights and obligations.`,
  },
  {
    id: 'severability',
    title: '19. Severability and General Provisions',
    content: `If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it enforceable, or if modification is not possible, it shall be severed from these Terms. The remaining provisions shall continue in full force and effect.

Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision. These Terms, together with the Privacy Policy and Cookie Policy, constitute the entire agreement between you and EventKnit regarding the Services and supersede all prior agreements, understandings, and negotiations.

You may not assign or transfer your rights or obligations under these Terms without our prior written consent. EventKnit may assign its rights and obligations without restriction.`,
  },
  {
    id: 'contact',
    title: '20. Contact Information',
    content: `If you have questions, concerns, or feedback about these Terms of Service, please reach us through any of the following channels:`,
    items: [
      'General inquiries & support: support@eventknit.com',
      'Legal matters: legal@eventknit.com',
      'Privacy-related concerns: privacy@eventknit.com',
      'Support section: eventknit.com/support',
    ],
    note: 'We aim to respond to all inquiries within two (2) business days.',
  },
  {
    id: 'third-party-links',
    title: '21. Third-Party Links and Services',
    content: `The Services may contain links to third-party websites, applications, venues, payment services, social media platforms, or other resources that are not owned or controlled by EventKnit. We provide these links for convenience only. EventKnit does not endorse and is not responsible for the content, terms, privacy practices, availability, or performance of any third-party services.

Your interactions with third-party services are solely between you and the applicable third party and are governed by that third party's terms and policies.`,
  },
  {
    id: 'electronic-communications',
    title: '22. Electronic Communications',
    content: `By creating an account or using the Services, you consent to receive communications from EventKnit electronically, including by email, in-product messages, SMS/WhatsApp where applicable, and notices posted on the platform. You agree that electronic communications satisfy any legal requirement that such communications be in writing, to the extent permitted by applicable law.

You are responsible for keeping your contact details up to date. You may opt out of non-essential marketing messages at any time, but transactional and service-related communications remain necessary for platform operation.`,
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
      subtitle="These Terms of Service govern your use of the EventKnit platform. Please read them carefully before creating an account or using our services."
      lastUpdated="April 2026"
      contactEmail="legal@eventknit.com"
      sections={sections}
    />
  );
};

export default TermsOfService;
