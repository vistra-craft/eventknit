import { FormPurpose } from '@prisma/client';
import type { FormQuestion } from '../types/form-question.types.js';

export interface BuiltInTemplate {
  name: string;
  description: string;
  purpose: FormPurpose;
  questions: FormQuestion[];
}

const opt = (values: string[]) => values.map((v) => ({ value: v, label: v }));

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  // ── Event Registration ────────────────────────────────────────
  {
    name: 'Event Registration',
    description: 'Standard attendee registration form collecting contact details and dietary preferences.',
    purpose: FormPurpose.REGISTRATION,
    questions: [
      { id: 'q1', order: 1, type: 'short_text',  label: 'Full Name',           placeholder: 'John Doe',               required: true },
      { id: 'q2', order: 2, type: 'email',        label: 'Email Address',       placeholder: 'john@example.com',        required: true },
      { id: 'q3', order: 3, type: 'phone',        label: 'Phone Number',        placeholder: '+254 712 345 678',        required: false },
      { id: 'q4', order: 4, type: 'short_text',   label: 'Organisation',        placeholder: 'Company / University',    required: false },
      { id: 'q5', order: 5, type: 'short_text',   label: 'Job Title',           placeholder: 'Software Engineer',       required: false },
      {
        id: 'q6', order: 6, type: 'dropdown', label: 'Dietary Requirements', required: false,
        options: opt(['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Other']),
      },
      { id: 'q7', order: 7, type: 'long_text',    label: 'Accessibility Needs', placeholder: 'Let us know if you need any accommodations.', required: false },
      {
        id: 'q8', order: 8, type: 'multiple_choice', label: 'I agree to the event terms and conditions', required: true,
        options: opt(['Yes, I agree']),
      },
    ],
  },

  // ── Post-Event Feedback ───────────────────────────────────────
  {
    name: 'Post-Event Feedback',
    description: 'Collect attendee ratings and suggestions after the event wraps up.',
    purpose: FormPurpose.FEEDBACK,
    questions: [
      { id: 'q1', order: 1, type: 'short_text',   label: 'Your Name',     placeholder: 'Optional',           required: false },
      { id: 'q2', order: 2, type: 'email',         label: 'Email (optional)', placeholder: 'For follow-up only', required: false },
      {
        id: 'q3', order: 3, type: 'rating', label: 'Overall Event Rating', required: true,
        minValue: 1, maxValue: 5, minLabel: 'Poor', maxLabel: 'Excellent',
      },
      {
        id: 'q4', order: 4, type: 'rating', label: 'Organisation & Logistics', required: true,
        minValue: 1, maxValue: 5, minLabel: 'Poor', maxLabel: 'Excellent',
      },
      {
        id: 'q5', order: 5, type: 'rating', label: 'Venue & Facilities', required: true,
        minValue: 1, maxValue: 5, minLabel: 'Poor', maxLabel: 'Excellent',
      },
      { id: 'q6', order: 6, type: 'long_text', label: 'What did you enjoy most?',   required: false, placeholder: 'Highlights of the event...' },
      { id: 'q7', order: 7, type: 'long_text', label: 'What could we improve?',     required: false, placeholder: 'Honest feedback helps us grow.' },
      {
        id: 'q8', order: 8, type: 'single_choice', label: 'Would you attend future events by this organiser?', required: false,
        options: opt(['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not']),
      },
    ],
  },

  // ── General Survey ────────────────────────────────────────────
  {
    name: 'General Survey',
    description: 'Gauge audience interests and opinions before or during an event.',
    purpose: FormPurpose.FEEDBACK,
    questions: [
      { id: 'q1', order: 1, type: 'short_text', label: 'Full Name',     placeholder: 'Optional',       required: false },
      { id: 'q2', order: 2, type: 'email',       label: 'Email Address', placeholder: 'your@email.com', required: false },
      {
        id: 'q3', order: 3, type: 'dropdown', label: 'Age Group', required: false,
        options: opt(['Under 18', '18-24', '25-34', '35-44', '45-54', '55+']),
      },
      {
        id: 'q4', order: 4, type: 'multiple_choice', label: 'Which topics interest you most?', required: false,
        options: opt(['Technology', 'Business', 'Arts & Culture', 'Health & Wellness', 'Sports', 'Education', 'Entertainment', 'Other']),
      },
      {
        id: 'q5', order: 5, type: 'single_choice', label: 'How did you hear about this event?', required: false,
        options: opt(['Social media', 'Friend / colleague', 'Email newsletter', 'Search engine', 'Event platform', 'Other']),
      },
      { id: 'q6', order: 6, type: 'long_text', label: 'Additional comments', placeholder: 'Anything else you\'d like to share?', required: false },
    ],
  },

  // ── Speaker Application ───────────────────────────────────────
  {
    name: 'Speaker Application',
    description: 'Call-for-speakers form with talk details and biographical information.',
    purpose: FormPurpose.SPEAKER_APPLICATION,
    questions: [
      { id: 'q1',  order: 1,  type: 'short_text',     label: 'Full Name',               placeholder: 'Jane Smith',           required: true },
      { id: 'q2',  order: 2,  type: 'email',           label: 'Email Address',           placeholder: 'jane@example.com',      required: true },
      { id: 'q3',  order: 3,  type: 'phone',           label: 'Phone Number',            placeholder: '+254 712 345 678',      required: false },
      { id: 'q4',  order: 4,  type: 'short_text',      label: 'Organisation',            placeholder: 'Company / University',  required: false },
      { id: 'q5',  order: 5,  type: 'short_text',      label: 'Job Title',               placeholder: 'CTO, Researcher, etc.', required: true },
      { id: 'q6',  order: 6,  type: 'short_text',      label: 'Proposed Talk Title',     placeholder: 'The Future of...',      required: true },
      {
        id: 'q7', order: 7, type: 'dropdown', label: 'Talk Format', required: true,
        options: opt(['Keynote (45 min)', 'Talk (25 min)', 'Lightning talk (10 min)', 'Workshop (90 min)', 'Panel participant']),
      },
      { id: 'q8',  order: 8,  type: 'long_text',       label: 'Talk Abstract',           placeholder: 'A brief description of your talk and key takeaways (max 300 words).', required: true },
      { id: 'q9',  order: 9,  type: 'long_text',       label: 'Speaker Bio',             placeholder: 'Brief professional biography (max 150 words).', required: true },
      { id: 'q10', order: 10, type: 'url',              label: 'LinkedIn Profile',        placeholder: 'https://linkedin.com/in/...', required: false },
      { id: 'q11', order: 11, type: 'url',              label: 'Website / Portfolio',     placeholder: 'https://',              required: false },
      { id: 'q12', order: 12, type: 'url',              label: 'Twitter / X',             placeholder: 'https://x.com/...',     required: false },
      { id: 'q13', order: 13, type: 'file_upload',      label: 'Profile / Headshot Photo', helpText: 'JPEG or PNG, max 5 MB. Used for event website and materials.', required: false, acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'], maxFileSizeMb: 5 },
      { id: 'q14', order: 14, type: 'long_text',        label: 'Previous speaking experience', placeholder: 'List relevant conferences or events you have spoken at.', required: false },
      {
        id: 'q15', order: 15, type: 'multiple_choice', label: 'Audio-visual requirements', required: false,
        options: opt(['Projector / screen', 'Microphone', 'Whiteboard', 'Live demo station', 'Interpreter']),
      },
    ],
  },

  // ── Exhibitor Application ─────────────────────────────────────
  {
    name: 'Exhibitor Application',
    description: 'Application form for companies and organisations requesting exhibition space.',
    purpose: FormPurpose.EXHIBITOR_APPLICATION,
    questions: [
      { id: 'q1',  order: 1,  type: 'short_text',     label: 'Company / Organisation Name', placeholder: 'Acme Corp',            required: true },
      { id: 'q2',  order: 2,  type: 'short_text',     label: 'Contact Person',              placeholder: 'Full name',             required: true },
      { id: 'q3',  order: 3,  type: 'email',           label: 'Email Address',               placeholder: 'contact@company.com',  required: true },
      { id: 'q4',  order: 4,  type: 'phone',           label: 'Phone Number',                placeholder: '+254 712 345 678',     required: true },
      { id: 'q5',  order: 5,  type: 'url',             label: 'Website',                     placeholder: 'https://',             required: false },
      { id: 'q5a', order: 6,  type: 'url',             label: 'LinkedIn Company Page',       placeholder: 'https://linkedin.com/company/...', required: false },
      { id: 'q5b', order: 7,  type: 'url',             label: 'Twitter / X',                 placeholder: 'https://x.com/...',     required: false },
      { id: 'q5c', order: 8,  type: 'file_upload',     label: 'Company Logo',                helpText: 'PNG or SVG preferred, max 5 MB. Used for event materials and the website.', required: false, acceptedFileTypes: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'], maxFileSizeMb: 5 },
      { id: 'q6',  order: 9,  type: 'long_text',       label: 'Company Description',         placeholder: 'Brief overview of your company and products/services.', required: true },
      {
        id: 'q7', order: 10, type: 'dropdown', label: 'Booth Size Preference', required: true,
        options: opt(['Small (3x3 m)', 'Medium (3x6 m)', 'Large (6x6 m)', 'Custom (specify in notes)']),
      },
      {
        id: 'q8', order: 11, type: 'multiple_choice', label: 'Required facilities', required: false,
        options: opt(['Power outlets', 'Wi-Fi', 'Display screens', 'Tables & chairs', 'Storage space', 'Demo station']),
      },
      { id: 'q9',  order: 12, type: 'long_text',       label: 'Products / Services to showcase', placeholder: 'What will you be displaying or demonstrating?', required: true },
      { id: 'q10', order: 13, type: 'long_text',        label: 'Additional requirements or notes', required: false },
    ],
  },

  // ── Volunteer Application ─────────────────────────────────────
  {
    name: 'Volunteer Application',
    description: 'Recruit volunteers for event-day operations, registration desks, and crowd management.',
    purpose: FormPurpose.VOLUNTEER_APPLICATION,
    questions: [
      { id: 'q1', order: 1, type: 'short_text', label: 'Full Name',    placeholder: 'Jane Doe',         required: true },
      { id: 'q2', order: 2, type: 'email',       label: 'Email Address', placeholder: 'jane@example.com', required: true },
      { id: 'q3', order: 3, type: 'phone',       label: 'Phone Number', placeholder: '+254 712 345 678', required: true },
      {
        id: 'q4', order: 4, type: 'dropdown', label: 'Age Group', required: true,
        options: opt(['18-24', '25-34', '35-44', '45+']),
      },
      {
        id: 'q5', order: 5, type: 'multiple_choice', label: 'Preferred volunteer roles', required: true,
        options: opt(['Registration & check-in', 'Crowd management', 'Speaker escort', 'A/V support', 'Information desk', 'First aid support', 'Social media coverage']),
      },
      {
        id: 'q6', order: 6, type: 'single_choice', label: 'T-shirt size', required: false,
        options: opt(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      },
      { id: 'q7', order: 7, type: 'long_text', label: 'Relevant experience',                               placeholder: 'Tell us about any previous volunteer or event experience.', required: false },
      { id: 'q8', order: 8, type: 'long_text', label: 'Why do you want to volunteer for this event?',       required: false },
      { id: 'q8a', order: 9, type: 'file_upload', label: 'Profile Photo', helpText: 'JPEG or PNG, max 5 MB. Optional — used for your volunteer badge.', required: false, acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'], maxFileSizeMb: 5 },
      {
        id: 'q9', order: 10, type: 'multiple_choice', label: 'I understand that volunteering is unpaid and I commit to attending the full event', required: true,
        options: opt(['Yes, I confirm']),
      },
    ],
  },

  // ── Sponsor Application ──────────────────────────────────────
  {
    name: 'Sponsor Application',
    description: 'Sponsorship enquiry form collecting company details, preferred tier, and branding requirements.',
    purpose: FormPurpose.SPONSOR_APPLICATION,
    questions: [
      { id: 'q1',  order: 1,  type: 'short_text',  label: 'Company / Organisation Name', placeholder: 'Acme Corp',                  required: true },
      { id: 'q2',  order: 2,  type: 'short_text',  label: 'Contact Person',              placeholder: 'Full name',                  required: true },
      { id: 'q3',  order: 3,  type: 'short_text',  label: 'Job Title',                   placeholder: 'Marketing Director, CEO…',   required: true },
      { id: 'q4',  order: 4,  type: 'email',        label: 'Email Address',               placeholder: 'sponsor@company.com',        required: true },
      { id: 'q5',  order: 5,  type: 'phone',        label: 'Phone Number',                placeholder: '+254 712 345 678',            required: false },
      { id: 'q6',  order: 6,  type: 'url',          label: 'Company Website',             placeholder: 'https://',                   required: false },
      { id: 'q7',  order: 7,  type: 'url',          label: 'LinkedIn Company Page',       placeholder: 'https://linkedin.com/company/...', required: false },
      { id: 'q8',  order: 8,  type: 'file_upload',  label: 'Company Logo',                helpText: 'PNG or SVG preferred, max 5 MB. Used on event materials and sponsor wall.', required: false, acceptedFileTypes: ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'], maxFileSizeMb: 5 },
      {
        id: 'q9', order: 9, type: 'dropdown', label: 'Preferred Sponsorship Tier', required: true,
        options: opt(['Title / Platinum', 'Gold', 'Silver', 'Bronze', 'Community partner', 'In-kind', 'Other (describe below)']),
      },
      { id: 'q10', order: 10, type: 'long_text',    label: 'What is your sponsorship budget range?', placeholder: 'e.g. USD 5,000–10,000 or equivalent in goods/services.', required: false },
      { id: 'q11', order: 11, type: 'long_text',    label: 'Company overview and reason for sponsoring', placeholder: 'Tell us about your company and why this event aligns with your goals.', required: true },
      {
        id: 'q12', order: 12, type: 'multiple_choice', label: 'Desired sponsorship benefits', required: false,
        options: opt(['Logo on event materials', 'Stage / MC mentions', 'Exhibition booth', 'Speaking slot', 'Social media features', 'Product sampling / giveaways', 'Newsletter inclusion', 'VIP access']),
      },
      { id: 'q13', order: 13, type: 'long_text',    label: 'Products or services you wish to promote', required: false },
      { id: 'q14', order: 14, type: 'long_text',    label: 'Any additional notes or requirements', required: false },
    ],
  },

  // ── Research Survey ───────────────────────────────────────────
  {
    name: 'Research Survey',
    description: 'Structured research survey with Likert scales, rankings, and open-ended questions for audience studies.',
    purpose: FormPurpose.FEEDBACK,
    questions: [
      { id: 'q1', order: 1, type: 'short_text',  label: 'Name (optional)',    placeholder: 'Leave blank to respond anonymously', required: false },
      { id: 'q2', order: 2, type: 'email',         label: 'Email (optional)',   placeholder: 'For follow-up questions only',        required: false },
      {
        id: 'q3', order: 3, type: 'section_break',
        label: 'About You', sectionTitle: 'About You', sectionDescription: 'Help us understand our respondents.', required: false,
      },
      {
        id: 'q4', order: 4, type: 'dropdown', label: 'Which best describes your role?', required: true,
        options: opt(['Student', 'Professional', 'Researcher / Academic', 'Business owner', 'Other']),
      },
      {
        id: 'q5', order: 5, type: 'dropdown', label: 'Years of experience in your field', required: false,
        options: opt(['Less than 1 year', '1-3 years', '4-7 years', '8-15 years', 'More than 15 years']),
      },
      {
        id: 'q6', order: 6, type: 'section_break',
        label: 'Topic Questions', sectionTitle: 'Topic Questions', required: false,
      },
      {
        id: 'q7', order: 7, type: 'scale', label: 'How familiar are you with this topic?', required: true,
        minValue: 1, maxValue: 5, minLabel: 'Not at all familiar', maxLabel: 'Very familiar',
      },
      {
        id: 'q8', order: 8, type: 'rating', label: 'How important is this topic to your work?', required: true,
        minValue: 1, maxValue: 5, minLabel: 'Not important', maxLabel: 'Extremely important',
      },
      {
        id: 'q9', order: 9, type: 'single_choice', label: 'How often do you engage with content on this topic?', required: false,
        options: opt(['Daily', 'Several times a week', 'Once a week', 'A few times a month', 'Rarely']),
      },
      { id: 'q10', order: 10, type: 'long_text',    label: 'What challenges do you face related to this topic?',              placeholder: 'Be as specific as possible.', required: false },
      { id: 'q11', order: 11, type: 'long_text',    label: 'What resources or solutions would be most helpful to you?',       required: false },
      {
        id: 'q12', order: 12, type: 'multiple_choice', label: 'Where do you currently get information on this topic?', required: false,
        options: opt(['Industry publications', 'Online communities', 'Conferences & events', 'Colleagues', 'Social media', 'Academic papers']),
      },
    ],
  },

  // ── Event Survey ──────────────────────────────────────────────
  {
    name: 'Event Survey',
    description: 'Mid-event or pre-event survey to capture audience interests, expectations, and preferences.',
    purpose: FormPurpose.FEEDBACK,
    questions: [
      { id: 'q1', order: 1, type: 'short_text',  label: 'Full Name',     placeholder: 'Optional', required: false },
      { id: 'q2', order: 2, type: 'email',         label: 'Email Address', placeholder: 'Optional', required: false },
      {
        id: 'q3', order: 3, type: 'single_choice', label: 'How did you hear about this event?', required: false,
        options: opt(['Social media', 'Email newsletter', 'Friend or colleague', 'Search engine', 'Event platform', 'Other']),
      },
      {
        id: 'q4', order: 4, type: 'multiple_choice', label: 'Which sessions are you most interested in?', required: false,
        options: opt(['Opening keynote', 'Technical workshops', 'Panel discussions', 'Networking sessions', 'Closing ceremony', 'Exhibition hall']),
      },
      {
        id: 'q5', order: 5, type: 'scale', label: 'How would you rate your expectations for this event?', required: false,
        minValue: 1, maxValue: 5, minLabel: 'Low expectations', maxLabel: 'Very high expectations',
      },
      {
        id: 'q6', order: 6, type: 'single_choice', label: 'Is this your first time attending this event?', required: false,
        options: opt(['Yes, first time', 'No, I have attended before']),
      },
      {
        id: 'q7', order: 7, type: 'single_choice', label: 'What is your primary goal for attending?', required: true,
        options: opt(['Networking', 'Learning new skills', 'Finding business opportunities', 'Staying up to date', 'Entertainment', 'Supporting the community']),
      },
      { id: 'q8', order: 8, type: 'long_text', label: 'What topics would you like to see covered?', placeholder: 'List any specific topics or questions you hope will be addressed.', required: false },
      {
        id: 'q9', order: 9, type: 'single_choice', label: 'Would you recommend this event to others?', required: false,
        options: opt(['Definitely', 'Probably', 'Not sure', 'Probably not']),
      },
      { id: 'q10', order: 10, type: 'long_text', label: 'Any additional comments or requests?', required: false },
    ],
  },

  // ── Performer / Artist Application ───────────────────────────
  {
    name: 'Performer / Artist Application',
    description: 'Application form for performers, musicians, dancers, comedians, and other artists requesting a slot at your event.',
    purpose: FormPurpose.PERFORMER_APPLICATION,
    questions: [
      { id: 'q1',  order: 1,  type: 'short_text',     label: 'Stage Name / Artist Name',        placeholder: 'Your performance name',           required: true },
      { id: 'q2',  order: 2,  type: 'short_text',     label: 'Legal Full Name',                  placeholder: 'As on ID',                        required: true },
      { id: 'q3',  order: 3,  type: 'email',           label: 'Email Address',                   placeholder: 'artist@example.com',               required: true },
      { id: 'q4',  order: 4,  type: 'phone',           label: 'Phone / WhatsApp',                placeholder: '+254 712 345 678',                 required: true },
      {
        id: 'q5', order: 5, type: 'dropdown', label: 'Performance Category', required: true,
        options: opt(['Music - Live Band', 'Music - Solo Artist', 'Music - DJ', 'Dance', 'Comedy / Stand-up', 'Spoken Word / Poetry', 'Theatre / Drama', 'Circus / Acrobatics', 'Magic / Illusion', 'Other']),
      },
      { id: 'q6',  order: 6,  type: 'long_text',       label: 'Artist Bio',                      placeholder: 'Tell us about yourself and your art (max 200 words).', required: true },
      { id: 'q7',  order: 7,  type: 'long_text',       label: 'Performance Description',         placeholder: 'What will you perform? Describe the act, genre, and mood.', required: true },
      {
        id: 'q8', order: 8, type: 'dropdown', label: 'Preferred Performance Duration', required: true,
        options: opt(['15 minutes', '30 minutes', '45 minutes', '60 minutes', 'Full evening set', 'Flexible']),
      },
      {
        id: 'q9', order: 9, type: 'multiple_choice', label: 'Technical requirements', required: false,
        options: opt(['PA system / sound system', 'Stage lighting', 'Backline (instruments)', 'Projection / screen', 'Wireless microphones', 'Power outlets on stage', 'Green room / dressing room']),
      },
      { id: 'q10', order: 10, type: 'url',              label: 'Portfolio / Demo Link',           placeholder: 'YouTube, SoundCloud, Instagram, etc.', required: false },
      { id: 'q11', order: 11, type: 'url',              label: 'Press Kit / EPK Link',            placeholder: 'https://',                         required: false },
      { id: 'q12', order: 12, type: 'short_text',       label: 'Management / Booking Contact',    placeholder: 'Name and email if different from above', required: false },
      { id: 'q12a', order: 13, type: 'file_upload', label: 'Press Photo / Promotional Image', helpText: 'JPEG or PNG, max 5 MB. Used on the event website and promotional materials.', required: false, acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'], maxFileSizeMb: 5 },
      {
        id: 'q13', order: 14, type: 'single_choice', label: 'Are you available for a soundcheck before the event?', required: true,
        options: opt(['Yes, I am available', 'Subject to scheduling', 'No']),
      },
      {
        id: 'q14', order: 15, type: 'multiple_choice', label: 'I agree to the terms of participation', required: true,
        options: opt(['Yes, I agree']),
      },
    ],
  },

  // ── Vendor Application ────────────────────────────────────────
  {
    name: 'Vendor Application',
    description: 'Application for food vendors, merchandise sellers, and service providers requesting a stall at your event.',
    purpose: FormPurpose.VENDOR_APPLICATION,
    questions: [
      { id: 'q1',  order: 1,  type: 'short_text',     label: 'Business / Stall Name',            placeholder: 'Your trading name',               required: true },
      { id: 'q2',  order: 2,  type: 'short_text',     label: 'Contact Person',                   placeholder: 'Full name',                        required: true },
      { id: 'q3',  order: 3,  type: 'email',           label: 'Email Address',                   placeholder: 'vendor@example.com',               required: true },
      { id: 'q4',  order: 4,  type: 'phone',           label: 'Phone Number',                    placeholder: '+254 712 345 678',                 required: true },
      {
        id: 'q5', order: 5, type: 'dropdown', label: 'Vendor Category', required: true,
        options: opt(['Food & Beverages', 'Merchandise / Apparel', 'Arts & Crafts', 'Books & Media', 'Technology & Gadgets', 'Health & Beauty', 'Services / Experiences', 'Other']),
      },
      { id: 'q6',  order: 6,  type: 'long_text',       label: 'Products / Services Description', placeholder: 'Describe what you will be selling or offering.', required: true },
      {
        id: 'q7', order: 7, type: 'dropdown', label: 'Stall Size Preference', required: true,
        options: opt(['Small (2x2 m)', 'Medium (3x3 m)', 'Large (3x6 m)', 'Food truck / trailer', 'Custom (specify below)']),
      },
      {
        id: 'q8', order: 8, type: 'multiple_choice', label: 'Required utilities', required: false,
        options: opt(['Electricity / power outlet', 'Water access', 'Waste disposal', 'Wi-Fi', 'Tables & chairs', 'Covered canopy']),
      },
      { id: 'q9',  order: 9,  type: 'short_text',       label: 'Business Registration Number',   placeholder: 'If applicable',                   required: false },
      {
        id: 'q10', order: 10, type: 'single_choice', label: 'Do you hold a valid food/health certificate? (for food vendors)', required: false,
        options: opt(['Yes', 'No', 'Not applicable']),
      },
      { id: 'q11', order: 11, type: 'url',              label: 'Website / Social Media Link',     placeholder: 'https://',                         required: false },
      { id: 'q11a', order: 12, type: 'file_upload', label: 'Business Logo or Product Photo', helpText: 'PNG or JPEG, max 5 MB. Used on the event vendor listing and materials.', required: false, acceptedFileTypes: ['image/png', 'image/jpeg', 'image/webp'], maxFileSizeMb: 5 },
      { id: 'q12', order: 13, type: 'long_text',        label: 'Previous events you have vended at', placeholder: 'List any relevant experience.', required: false },
      { id: 'q13', order: 14, type: 'long_text',        label: 'Additional notes or requests',    required: false },
    ],
  },

  // ── Judge / Reviewer Application ──────────────────────────────
  {
    name: 'Judge / Reviewer Application',
    description: 'Application for judges, evaluators, and reviewers for competitions, hackathons, pitch events, and award ceremonies.',
    purpose: FormPurpose.JUDGE_APPLICATION,
    questions: [
      { id: 'q1',  order: 1,  type: 'short_text',     label: 'Full Name',                        placeholder: 'Jane Smith',                       required: true },
      { id: 'q2',  order: 2,  type: 'email',           label: 'Email Address',                   placeholder: 'judge@example.com',                required: true },
      { id: 'q3',  order: 3,  type: 'phone',           label: 'Phone Number',                    placeholder: '+254 712 345 678',                 required: false },
      { id: 'q4',  order: 4,  type: 'short_text',      label: 'Current Job Title',               placeholder: 'e.g. CEO, Professor, Investor',   required: true },
      { id: 'q5',  order: 5,  type: 'short_text',      label: 'Organisation / Affiliation',      placeholder: 'Company, institution, or firm',   required: true },
      {
        id: 'q6', order: 6, type: 'multiple_choice', label: 'Areas of Expertise', required: true,
        options: opt(['Technology & Engineering', 'Business & Finance', 'Marketing & Branding', 'Design & Creative', 'Science & Research', 'Legal & Compliance', 'Social Impact', 'Healthcare', 'Agriculture & Food', 'Education', 'Other']),
      },
      { id: 'q7',  order: 7,  type: 'long_text',       label: 'Professional Bio',                placeholder: 'Brief biography (max 200 words).', required: true },
      { id: 'q8',  order: 8,  type: 'long_text',       label: 'Relevant judging or evaluation experience', placeholder: 'List previous competitions, panels, or review boards you have served on.', required: false },
      {
        id: 'q9', order: 9, type: 'single_choice', label: 'Are you available for the full judging period?', required: true,
        options: opt(['Yes, fully available', 'Available for some sessions only (explain below)', 'Unsure at this stage']),
      },
      { id: 'q10', order: 10, type: 'url',              label: 'LinkedIn Profile',                placeholder: 'https://linkedin.com/in/...',      required: false },
      { id: 'q10a', order: 11, type: 'file_upload', label: 'Headshot / Profile Photo', helpText: 'JPEG or PNG, max 5 MB. Used for the event judge showcase.', required: false, acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'], maxFileSizeMb: 5 },
      {
        id: 'q11', order: 12, type: 'single_choice', label: 'Do you have any conflicts of interest with the competing teams/entries?', required: true,
        options: opt(['No conflicts', 'Potential conflict — I will disclose details', 'Yes — I have a conflict']),
      },
      { id: 'q12', order: 13, type: 'long_text',        label: 'Conflict of interest details (if any)', required: false },
      {
        id: 'q13', order: 14, type: 'multiple_choice', label: 'I agree to maintain confidentiality and judge impartially', required: true,
        options: opt(['Yes, I agree']),
      },
    ],
  },

  // ── Media / Press Application ─────────────────────────────────
  {
    name: 'Media / Press Application',
    description: 'Credential application for journalists, photographers, videographers, bloggers, and media outlets.',
    purpose: FormPurpose.MEDIA_APPLICATION,
    questions: [
      { id: 'q1',  order: 1,  type: 'short_text',     label: 'Full Name',                        placeholder: 'Your name as on press ID',         required: true },
      { id: 'q2',  order: 2,  type: 'email',           label: 'Email Address',                   placeholder: 'press@media.com',                  required: true },
      { id: 'q3',  order: 3,  type: 'phone',           label: 'Phone / WhatsApp',                placeholder: '+254 712 345 678',                 required: true },
      { id: 'q4',  order: 4,  type: 'short_text',      label: 'Media Organisation / Outlet',     placeholder: 'Publication, channel, or outlet', required: true },
      {
        id: 'q5', order: 5, type: 'dropdown', label: 'Media Type', required: true,
        options: opt(['Print journalist', 'Online journalist / blogger', 'Broadcast / TV', 'Radio', 'Photographer', 'Videographer / Filmmaker', 'Podcast', 'Social media / influencer', 'Other']),
      },
      { id: 'q6',  order: 6,  type: 'url',             label: 'Publication / Channel Website',   placeholder: 'https://',                         required: false },
      { id: 'q7',  order: 7,  type: 'number',           label: 'Approximate Audience / Reach',   placeholder: 'Monthly readers, followers, etc.', required: false },
      { id: 'q8',  order: 8,  type: 'long_text',        label: 'Intended Coverage',               placeholder: 'What aspects of the event do you plan to cover? Where will it be published?', required: true },
      {
        id: 'q9', order: 9, type: 'multiple_choice', label: 'Equipment you will bring', required: false,
        options: opt(['DSLR / mirrorless camera', 'Video camera', 'Drone', 'Audio recorder', 'Lighting equipment', 'Laptop only']),
      },
      {
        id: 'q10', order: 10, type: 'single_choice', label: 'Do you require a dedicated press area / work space?', required: false,
        options: opt(['Yes', 'No', 'Preferred but not essential']),
      },
      {
        id: 'q11', order: 11, type: 'single_choice', label: 'Are you accredited with a recognised media body?', required: false,
        options: opt(['Yes — I can provide proof', 'No — I am an independent journalist/creator', 'Not applicable']),
      },
      { id: 'q12', order: 12, type: 'url',              label: 'Portfolio / Recent work link',    placeholder: 'https://',                         required: false },
      { id: 'q12a', order: 13, type: 'file_upload', label: 'Headshot / Press ID Photo', helpText: 'JPEG or PNG, max 5 MB. Used for your press accreditation badge.', required: false, acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'], maxFileSizeMb: 5 },
      {
        id: 'q13', order: 14, type: 'multiple_choice', label: 'I agree to follow the event media guidelines and will share a copy of my coverage', required: true,
        options: opt(['Yes, I agree']),
      },
    ],
  },

  // ── Knowledge Quiz ────────────────────────────────────────────
  {
    name: 'Knowledge Quiz',
    description: 'Multiple-choice quiz to assess audience knowledge on a topic before or after a session.',
    purpose: FormPurpose.CUSTOM,
    questions: [
      { id: 'q1', order: 1, type: 'short_text',  label: 'Full Name',    required: true,  placeholder: 'Your name' },
      { id: 'q2', order: 2, type: 'email',         label: 'Email Address', required: true,  placeholder: 'your@email.com' },
      {
        id: 'q3', order: 3, type: 'section_break',
        label: 'Quiz', sectionTitle: 'Quiz', sectionDescription: 'Select the best answer for each question.', required: false,
      },
      {
        id: 'q4', order: 4, type: 'single_choice', label: 'Question 1: [Enter your question here]', required: true,
        options: opt(['Option A', 'Option B', 'Option C', 'Option D']),
      },
      {
        id: 'q5', order: 5, type: 'single_choice', label: 'Question 2: [Enter your question here]', required: true,
        options: opt(['Option A', 'Option B', 'Option C', 'Option D']),
      },
      {
        id: 'q6', order: 6, type: 'single_choice', label: 'Question 3: [Enter your question here]', required: true,
        options: opt(['Option A', 'Option B', 'Option C', 'Option D']),
      },
      {
        id: 'q7', order: 7, type: 'single_choice', label: 'Question 4: [Enter your question here]', required: true,
        options: opt(['Option A', 'Option B', 'Option C', 'Option D']),
      },
      {
        id: 'q8', order: 8, type: 'single_choice', label: 'Question 5: [Enter your question here]', required: true,
        options: opt(['Option A', 'Option B', 'Option C', 'Option D']),
      },
      { id: 'q9', order: 9, type: 'long_text', label: 'Any comments or feedback on the quiz?', required: false },
    ],
  },
];
