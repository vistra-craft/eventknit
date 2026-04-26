# EventKnit V2 — World-Class Feature Roadmap

> Benchmarked against Quicket, Eventbrite, Ticket Tailor, Luma, and Hopin.
> Priority levels: 🔴 Critical (table-stakes competitive) · 🟡 High (strong differentiator) · 🟢 Nice-to-have (scale features)

---

## 1. Event Discovery & Marketplace

The browse/discovery experience is your top-of-funnel. Organizers bring their audiences, but you need to grow a native audience too.

| Feature | Priority | Notes |
|---|---|---|
| Advanced search with filters (category, date, price, location, format) | 🔴 | Quicket and Eventbrite both do this well |
| Map-based event discovery | 🟡 | Critical for a mobile-first Kenya audience |
| Personalised event recommendations | 🟡 | Based on past attendance, categories followed |
| "Events near you" (geolocation) | 🟡 | GPS-based, works offline with cached city |
| Event categories & curated collections | 🔴 | Tech, Music, Campus, Business, Nightlife, etc. |
| Featured / promoted events on homepage | 🔴 | Revenue lever — organizers pay for placement |
| Trending events badge | 🟡 | Driven by ticket velocity, not just total sales |
| Organizer public profile page | 🟡 | Shows all events, reviews, follower count |
| Follow an organizer | 🟡 | Users get notified of new events |
| Save / wishlist events | 🟢 | Reminders when ticket price changes or event is close |

---

## 2. Ticketing Enhancements

Quicket's model is simple and flexible. Right now EventKnit's checkout has friction points and limited ticket configurations.

| Feature | Priority | Notes |
|---|---|---|
| One-step guest checkout (no account required) | 🔴 | Partially built — needs to be the default, not the fallback |
| Group / bulk ticket purchasing (1 order, N tickets) | 🔴 | Critical for families, corporates, friend groups |
| Early bird pricing with automatic expiry | 🔴 | Set a date/qty threshold, price auto-adjusts |
| Ticket bundles (e.g. VIP + parking + meal) | 🟡 | High AOV, popular for concerts and galas |
| Add-on purchases at checkout (merch, meals, parking) | 🟡 | Separate revenue stream per event |
| Donation / tip option at checkout | 🟡 | Good for community and charity events |
| Dynamic / surge pricing | 🟢 | Price rises as capacity fills — used by concerts |
| Ticket transfer (attendee transfers to someone else) | 🔴 | Major UX gap without this |
| Ticket resale marketplace | 🟡 | Already started — complete and launch it |
| Complimentary / comp ticket issuance by organizer | 🔴 | Speakers, press, sponsors always need comps |
| Private / invite-only ticket types | 🟡 | Hidden ticket tiers unlocked by promo code or invite link |
| Waitlist with automatic offer on cancellation | 🟡 | Drives conversion on sold-out events |
| Installment payment plans | 🟢 | For high-price events (KSh 10k+), pay in 2–3 installments |

---

## 3. Marketing & Promotion Tools

This is where Quicket builds the most loyalty from organizers. Your marketing toolkit needs to be a real reason to choose EventKnit.

| Feature | Priority | Notes |
|---|---|---|
| Tracking links (per channel UTM — WhatsApp, Instagram, email, etc.) | 🔴 | Organizers need to know where their sales come from |
| Promoter / affiliate network | 🔴 | Organizers add promoters who earn a cut per ticket sold |
| Promotional codes (% off, fixed amount, BOGO) | 🔴 | Already partially built — needs full configurability |
| Embed widget (sell tickets directly from organizer's own site) | 🟡 | Quicket and Eventbrite both offer this |
| Social sharing cards (auto-generated Open Graph images) | 🔴 | Whatsapp link previews with event image — huge for Kenya |
| WhatsApp broadcast to past attendees | 🔴 | Biggest distribution channel in Kenya, build this natively |
| Email campaign builder to attendee lists | 🟡 | Send updates, reminders, post-event follow-ups |
| Countdown timers and urgency widgets | 🟡 | "Only 12 tickets left" live counters |
| Retargeting pixel support (Meta Pixel, Google Tag) | 🟡 | Organizers run their own paid ads |
| Referral program (attendee gets reward for referring others) | 🟡 | Virality mechanic |
| SMS notification campaigns | 🟡 | Fallback for non-WhatsApp users |
| Push notification campaigns | 🟡 | Already have the infrastructure — expose it to organizers |

---

## 4. WhatsApp-First Registration (Planned — Make it a Moat)

This is your biggest differentiator in Africa. No competitor does this well. Build it right.

| Feature | Priority | Notes |
|---|---|---|
| WhatsApp AI registration flow (conversational ticketing) | 🔴 | User types event name in WhatsApp → AI guides them through registration and payment |
| WhatsApp ticket delivery (PDF/image ticket sent via WhatsApp) | 🔴 | Many Kenya users don't check email consistently |
| WhatsApp check-in confirmation (scan → WhatsApp notification) | 🟡 | Instant confirmation at venue |
| WhatsApp event reminders (24h and 1h before event) | 🔴 | Reduces no-shows dramatically |
| WhatsApp organizer alerts (ticket sold, check-in started) | 🟡 | Real-time sales notifications |
| WhatsApp-based support bot for attendees | 🟢 | FAQs, ticket resend, transfer requests |

---

## 5. On-Site Experience

Quicket mentions scanning equipment, on-site sales, and a "field service team" as a differentiator. This is the execution layer that builds trust.

| Feature | Priority | Notes |
|---|---|---|
| Dedicated check-in app (PWA or native) for door staff | 🔴 | Current badge/check-in works but needs a standalone staff-facing mode |
| Multi-door / multi-device scanning | 🔴 | Large events need 5–10 scanners simultaneously |
| Offline scanning mode (sync when back online) | 🔴 | Kenya venues often have poor connectivity |
| On-site ticket sales (organizer sells at the door) | 🟡 | Cash + M-Pesa STK push for walk-ins |
| Staff access management (grant limited check-in-only role) | 🔴 | Organizer adds door staff without giving them full dashboard |
| Real-time check-in dashboard (live count on organizer screen) | 🔴 | Organizer sees capacity filling in real time |
| Wristband / RFID integration | 🟢 | Long-term — for large festivals and concerts |
| On-site hardware rental (scanners, printers) | 🟢 | Quicket's "field service" — potential services revenue stream |

---

## 6. Seating & Venue Builder

Quicket's drag-and-drop seating plan is a key differentiator for conferences, galas, concerts, and sports. EventKnit already has a `SeatReservation` model — the UI needs to match.

| Feature | Priority | Notes |
|---|---|---|
| Drag-and-drop seating plan builder (halls, theaters, stadiums) | 🟡 | Already have backend — need the visual builder |
| Table layout for dinners and galas | 🟡 | "Table of 10" model, not just individual seats |
| Accessibility / wheelchair seat marking | 🟡 | Legal and UX requirement |
| Venue library (organizer saves and reuses venue layouts) | 🟡 | Save time for recurring event organizers |
| Seat category pricing (GA, VIP, VVIP, Pit) | 🔴 | Already partially modelled — surface in UI fully |
| Visual seat selection for attendees at checkout | 🔴 | Attendee picks their seat on a map before paying |

---

## 7. Analytics & Reporting

Quicket calls out "real-time reports, analytics, reviews" as a pillar. Right now EventKnit's analytics are gated behind tiers but the breadth needs expanding.

| Feature | Priority | Notes |
|---|---|---|
| Real-time sales dashboard (revenue, tickets sold, check-in %) | 🔴 | The core organizer screen |
| Traffic source breakdown (where buyers came from) | 🔴 | Tracking link data feeds this |
| Sales over time chart (hourly, daily, by tier) | 🔴 | When did the spike happen? Why? |
| Geographic breakdown (county / city of attendees) | 🟡 | Useful for organizers targeting regional audiences |
| Ticket type breakdown (GA vs VIP vs Early Bird) | 🔴 | Revenue mix analysis |
| Check-in report (who arrived, arrival time distribution) | 🔴 | Essential for capacity and future planning |
| Repeat vs new attendee tracking | 🟡 | Cohort loyalty metric |
| Post-event summary PDF / email report | 🟡 | Auto-sent to organizer 24h after event ends |
| Downloadable data (CSV, Excel) | 🔴 | Subscription-gated but must exist |
| Event comparison across organizer's history | 🟢 | "Your last 5 events" trends |
| Revenue payout forecast (after fees, estimated payout date) | 🟡 | Reduces organizer support queries |

---

## 8. Reviews & Social Proof

Quicket lists reviews as a feature. This builds trust in your discovery marketplace and creates accountability.

| Feature | Priority | Notes |
|---|---|---|
| Post-event attendee review (star rating + text) | 🟡 | Sent automatically 24h after event |
| Organizer public rating (aggregate of all events) | 🟡 | Shown on organizer profile and event pages |
| Organizer response to reviews | 🟡 | Standard for trust-building |
| Review moderation (flag spam/abuse) | 🟡 | Admin tool |
| "Verified attendee" badge on reviews | 🔴 | Only people who attended can review — prevents gaming |
| Review summary shown on event page | 🔴 | Social proof at point of purchase |

---

## 9. Recurring Events & Templates

A recurring event organizer (weekly market, monthly meetup, term-time class) is your highest LTV customer.

| Feature | Priority | Notes |
|---|---|---|
| Recurring event setup (daily/weekly/monthly/custom) | 🔴 | Quicket does this — critical for community organizers |
| Event templates (duplicate a past event in one click) | 🔴 | Simple but high-value time saver |
| Series / season pass ticket (one ticket, multiple dates) | 🟡 | Bundled ticket across a recurring series |
| Multi-day event (single event spanning multiple days) | 🔴 | Conferences, festivals, boot camps |
| Agenda / schedule builder per day | 🟡 | Sessions, speakers, breaks — already have speaker model |

---

## 10. Custom Data Collection (Forms)

Quicket calls this "Custom Data Collection." Your planned forms feature — make it powerful.

| Feature | Priority | Notes |
|---|---|---|
| Custom registration form builder (drag-and-drop fields) | 🔴 | Text, dropdown, checkbox, file upload, T-shirt size, dietary, etc. |
| Per-ticket-type forms (VIP gets different questions) | 🟡 | Corporate events need this |
| Conditional logic (show field only if previous answer is X) | 🟡 | Reduces friction for most attendees |
| GDPR / Data Protection Act consent per field | 🔴 | Already have consent model — wire it to custom fields |
| Form response export (CSV/Excel) | 🔴 | The point of collecting data is using it |
| Form data shown per attendee in organizer dashboard | 🔴 | Check-in staff need to see dietary/accessibility needs |

---

## 11. Payouts & Financial Management

This is where organizers decide whether they trust you with their money.

| Feature | Priority | Notes |
|---|---|---|
| Organizer payout dashboard (earnings, pending, paid out) | 🔴 | Real-time visibility on money owed to them |
| Flexible payout schedule (daily / weekly / on-demand) | 🟡 | Quicket holds until after event by default — let organizers choose |
| M-Pesa direct payout (not just bank transfer) | 🔴 | This is Kenya — M-Pesa payout is expected |
| Partial / early payout requests | 🟡 | Organizer may need funds before the event to pay for the venue |
| Invoice / receipt generation | 🔴 | Corporate clients need this for accounting |
| Tax reports (annual, per event) | 🟡 | VAT / KRA compliance |
| Refund management dashboard | 🔴 | Organizer initiates refund per attendee or bulk |
| Flexible fee routing | 🔴 | Organizer absorbs fee OR passes to buyer at checkout — Quicket does both |
| Split payouts (e.g. venue gets 20%, organizer gets 80%) | 🟢 | Venue partnerships — long-term revenue model |

---

## 12. Team & Collaboration

Single-organizer accounts don't scale. Events need teams.

| Feature | Priority | Notes |
|---|---|---|
| Multi-user organizer accounts | 🔴 | Add co-organizers with different permission levels |
| Role-based access control (Owner, Manager, Marketing, Check-in) | 🔴 | Check-in staff shouldn't see financial data |
| Activity log (who changed what and when) | 🟡 | Audit trail for team accountability |
| Organizer sub-accounts / agency management | 🟡 | An agency manages 10 client organizer accounts |

---

## 13. API & Integrations

Quicket offers API integration for ticket sales on external sites. This unlocks B2B and developer adoption.

| Feature | Priority | Notes |
|---|---|---|
| Public REST API (create events, list tickets, check-in) | 🟡 | Enterprise-tier feature, major stickiness driver |
| Webhook support (ticket.sold, attendee.checked_in, refund.issued) | 🟡 | Organizers integrate with their own systems |
| Embed widget (ticket checkout iframe for external site) | 🟡 | Sell tickets on organizer's own website |
| Google Calendar / iCal export | 🔴 | One-click "Add to Calendar" on ticket confirmation |
| Zapier / Make.com integration | 🟢 | No-code automation for organizers |
| Mailchimp / Brevo sync (export attendee lists to email tools) | 🟡 | Marketing integration |
| Meta Pixel / Google Tag pass-through | 🟡 | Organizer's own ad tracking |
| Social login (Google, Apple) | 🔴 | Reduces friction at signup — major conversion improvement |

---

## 14. Attendee Experience (The Side Most Platforms Neglect)

EventKnit already has `EventAttendeeView` — build on it.

| Feature | Priority | Notes |
|---|---|---|
| Personal event wallet (all tickets in one place) | 🔴 | Current MyEvent tab is this — polish and make it the core |
| "Add to Wallet" (Apple Wallet / Google Wallet) | 🟡 | Digital ticket in phone wallet, no app required |
| Event reminders (push + WhatsApp + email) | 🔴 | 24h and 1h before — reduces no-shows |
| Attendee networking (see who else is going, opt-in) | 🟢 | Luma does this well — niche but powerful for professional events |
| Personal agenda builder (select sessions from multi-track events) | 🟡 | Already have Agenda tab — make it interactive |
| Post-event resource sharing (slides, recordings, photos) | 🟡 | Organizer uploads, attendees access via their ticket |
| Event feedback / NPS survey (post-event) | 🟡 | Feeds the reviews system |
| Loyalty / reward points for repeat attendance | 🟢 | Long-term retention mechanic |

---

## 15. Virtual & Hybrid Events

Post-COVID, every serious platform supports this. It also expands your market beyond Nairobi.

| Feature | Priority | Notes |
|---|---|---|
| Online event type (link / streaming URL revealed after ticket purchase) | 🔴 | Simple to add, table-stakes now |
| Hybrid event (in-person + online tickets, different pricing) | 🟡 | One event, two audiences |
| Native livestream integration (YouTube Live, Zoom, StreamYard) | 🟡 | Don't build your own — embed external streams |
| Virtual networking rooms | 🟢 | Complex — use a third-party embed (Hopin-style) |

---

## 16. Compliance & Trust

Kenya has the Data Protection Act 2019. Get ahead of it.

| Feature | Priority | Notes |
|---|---|---|
| Kenya Data Protection Act compliance (DPA 2019) | 🔴 | Consent model already exists — document and surface it properly |
| GDPR-ready (for diaspora/international organizers) | 🟡 | Data export, right to deletion, consent audit |
| PCI DSS compliance documentation | 🔴 | Required for any card payment handling |
| KYC for organizers (ID + bank account verification before payout) | 🔴 | Already have kyc_document.md — implement it |
| Fraud detection (unusual sales spikes, chargeback risk) | 🟡 | Protect your payout float |
| Event insurance integration (third-party) | 🟢 | Eventbrite offers this — niche but builds trust |

---

## 17. Admin & Platform Operations

Internal tools that make you fast to operate.

| Feature | Priority | Notes |
|---|---|---|
| Admin event moderation (approve/reject/flag events) | 🔴 | Prevent fraudulent events |
| Admin organizer KYC review workflow | 🔴 | Wire KYC docs to payout unlock |
| Platform-wide announcements / maintenance banners | 🟡 | Communicate outages without a support flood |
| Dispute resolution workflow (attendee vs organizer) | 🟡 | Refund disputes need a structured process |
| Revenue reporting dashboard (total GMV, fees collected, payouts) | 🔴 | Internal finance visibility |
| Subscription management (override tiers, grant free pro access) | 🔴 | Already partially built — finish it |

---

## Summary: What to Ship First in V2

Rank by impact × effort × Kenya-market fit:

1. **One-step guest checkout** — removes the single biggest conversion blocker
2. **WhatsApp ticket delivery + event reminders** — highest reach in Kenya
3. **Tracking links + promoter network** — unlocks organic growth
4. **Staff check-in app (offline-capable)** — table-stakes for any real event
5. **Flexible fee routing (pass to buyer)** — what every organizer asks for first
6. **Custom registration forms** — planned, ship it
7. **Recurring events + templates** — retains your best customers
8. **Organizer payout dashboard + M-Pesa payout** — builds financial trust
9. **Post-event reviews** — powers the discovery marketplace
10. **Google/Apple Calendar export + social login** — small effort, high attendee satisfaction

---

*Last updated: April 2026. Benchmarked against Quicket, Eventbrite, Ticket Tailor, Luma, and Hopin.*
