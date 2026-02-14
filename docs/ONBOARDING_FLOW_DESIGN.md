# EventKnit Unified Onboarding Flow Design

**Purpose:** Define the new preference-based, interactive onboarding experience for all users (replacing role-based onboarding).

**Last Updated:** February 2026
**Design Phase:** Planning & Prototyping

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Onboarding Flow Overview](#onboarding-flow-overview)
3. [Screen-by-Screen Breakdown](#screen-by-screen-breakdown)
4. [Interactive Elements](#interactive-elements)
5. [Data Collection Strategy](#data-collection-strategy)
6. [Implementation Specs](#implementation-specs)
7. [Success Metrics](#success-metrics)

---

## Design Philosophy

### Core Principles

**1. Preference-Based, Not Role-Based**
- Don't ask "What role are you?"
- Ask "What brings you here today?"
- Users can express interest in both attending AND organizing

**2. Progressive Disclosure**
- Show only what's relevant to their stated interests
- Each screen builds on previous answers
- No overwhelming walls of options

**3. Interactive & Engaging**
- Visual, not just text-heavy forms
- Animations and micro-interactions
- Feels like a conversation, not interrogation

**4. Quick & Optional**
- 3-5 screens max (under 90 seconds)
- "Skip" option on every screen (except first)
- Can complete later from settings

**5. Personalization-First**
- Immediately use collected data
- Show relevant events on first dashboard view
- Tailor notifications to preferences

### Industry Inspiration

| Platform | What We're Taking |
|----------|-------------------|
| **Duolingo** | Playful animations, progress indicators, goal-setting |
| **Notion** | Clean minimal design, smart defaults, quick setup |
| **Linear** | Keyboard shortcuts, skip-heavy flow, no friction |
| **Airbnb** | Visual category selection, contextual help |
| **Spotify** | Interest bubbles, genre selection, "tell us more" approach |

---

## Onboarding Flow Overview

### User Journey Map

```
┌──────────────────────────────────────────────────────────────────┐
│  REGISTRATION COMPLETE → Onboarding Starts                       │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  SCREEN 1: Welcome & Intent                                      │
│  "What brings you to EventKnit?"                                 │
│  ☐ Attend events  ☐ Organize events  ☐ Both                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                     ┌────────┴────────┐
                     │                 │
            ┌────────▼────────┐   ┌───▼──────────────┐
            │  ATTENDEE PATH  │   │  ORGANIZER PATH  │
            │  (Screens 2-4)  │   │  (Screens 2-4)   │
            └────────┬────────┘   └───┬──────────────┘
                     │                 │
                     └────────┬────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  SCREEN 5: Platform Tour (Optional)                              │
│  3 quick feature highlights with animations                      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  SCREEN 6: Notification Preferences                              │
│  Quick toggle: Email, SMS, Push (smart defaults)                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  COMPLETE → Unified Dashboard (personalized)                     │
└──────────────────────────────────────────────────────────────────┘
```

### Flow Characteristics

- **Adaptive:** Changes based on Screen 1 choice
- **Non-linear:** Can skip forward or go back
- **Persistent:** Progress saved, can resume later
- **Optional:** "Skip to dashboard" button always visible
- **Fast:** Under 90 seconds for completion

---

## Screen-by-Screen Breakdown

### Screen 1: Welcome & Intent

**Purpose:** Understand what user wants to do (without locking them into a role)

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●○○○○]               [Skip tour →]      │
│                                                     │
│  👋 Welcome to EventKnit, [FirstName]!             │
│                                                     │
│  What brings you here today?                       │
│  (Select all that apply)                           │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │  🎟️               │  │  📅               │       │
│  │  Attend events   │  │  Organize events │       │
│  │                  │  │                  │       │
│  │  Discover and    │  │  Create and      │       │
│  │  register for    │  │  manage events   │       │
│  │  events          │  │                  │       │
│  │                  │  │                  │       │
│  │  [ ] Select      │  │  [ ] Select      │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                     │
│  💡 You can do both! Select what interests you.    │
│                                                     │
│  [Cannot continue without selection]               │
│              [Continue →]                          │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Cards have hover/focus states
- Selecting one or both animates the cards (scale, glow)
- Continue button enables only when at least one selected
- Confetti animation when both selected (celebrates versatility)

**Data Collected:**
- `onboardingIntent`: `"attend"` | `"organize"` | `"both"`

**Backend Action:**
- Store in `user.onboardingPreferences` JSON field
- Use to personalize dashboard

---

### Screen 2A: Attendee Path - Interest Selection

**Shown When:** User selected "Attend events" or "Both"

**Purpose:** Understand event interests for personalized recommendations

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●○○○]               [Skip tour →]      │
│                                                     │
│  What kind of events interest you?                 │
│  Select as many as you like                        │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 🎵  │ │ 🎭  │ │ 🎨  │ │ 🏀  │ │ 💼  │          │
│  │Music│ │Shows│ │Arts │ │Sport│ │Biz  │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 🍔  │ │ 💻  │ │ 🧘  │ │ 🎓  │ │ 🎮  │          │
│  │Food │ │Tech │ │Well.│ │Edu  │ │Game │          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │ 🌍  │ │ 🎪  │ │ 👨‍👩‍👧‍👦│ │ ➕  │                  │
│  │Comm │ │Fest │ │Fam  │ │More │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                     │
│  💡 We'll show you events matching your interests  │
│                                                     │
│  [← Back]              [Skip]     [Continue →]     │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Tap to select/deselect (multi-select)
- Selected items glow/scale up
- Smooth spring animations
- "More" opens full category list modal
- Haptic feedback on mobile

**Data Collected:**
- `eventInterests`: Array of category IDs
- Example: `["music", "tech", "food"]`

**Smart Defaults:**
- If they skip, use popular categories in their region

---

### Screen 2B: Organizer Path - Event Type

**Shown When:** User selected "Organize events" or "Both"

**Purpose:** Understand what type of events they want to create

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●○○○]               [Skip tour →]      │
│                                                     │
│  What type of events do you want to organize?      │
│  Select all that apply                             │
│                                                     │
│  ┌───────────────────┐  ┌───────────────────┐     │
│  │  🎫                │  │  🏢                │     │
│  │  Public Events    │  │  Private Events   │     │
│  │                   │  │                   │     │
│  │  Concerts, fests, │  │  Corporate, team  │     │
│  │  conferences      │  │  events, private  │     │
│  │                   │  │                   │     │
│  │  [ ] Select       │  │  [ ] Select       │     │
│  └───────────────────┘  └───────────────────┘     │
│                                                     │
│  ┌───────────────────┐  ┌───────────────────┐     │
│  │  📍                │  │  🌐                │     │
│  │  In-Person        │  │  Virtual/Hybrid   │     │
│  │                   │  │                   │     │
│  │  Venue-based      │  │  Online or both   │     │
│  │  physical events  │  │  formats          │     │
│  │                   │  │                   │     │
│  │  [ ] Select       │  │  [ ] Select       │     │
│  └───────────────────┘  └───────────────────┘     │
│                                                     │
│  💡 This helps us tailor your event creation flow  │
│                                                     │
│  [← Back]              [Skip]     [Continue →]     │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Multi-select cards
- Visual feedback on selection
- Contextual help tooltips

**Data Collected:**
- `organizerEventTypes`: `["public", "private", "in_person", "virtual"]`

**Smart Features:**
- If they select "public + in-person", show venue setup tips
- If "virtual", highlight streaming integrations

---

### Screen 3A: Attendee Path - Location Preferences

**Shown When:** User selected "Attend events" or "Both"

**Purpose:** Location-based event recommendations

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●●○○]               [Skip tour →]      │
│                                                     │
│  Where would you like to find events?              │
│                                                     │
│  📍 Your Location                                   │
│  ┌────────────────────────────────────────┐        │
│  │  [Nairobi, Kenya            ] [Detect] │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  Search radius:                                    │
│  ┌─────────────────────────────────────┐           │
│  │ ●─────○─────────────────────────── │           │
│  │ 5km   25km   50km   100km   250km  │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  Also interested in:                               │
│  ☐ Virtual events (attend from anywhere)          │
│  ☐ Events in other cities (willing to travel)     │
│                                                     │
│  💡 [23 events] happening near you this month      │
│                                                     │
│  [← Back]              [Skip]     [Continue →]     │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- "Detect" uses browser geolocation
- Slider has haptic feedback
- Live count updates as radius changes
- City autocomplete with popular cities

**Data Collected:**
- `location`: `{ city, country, coordinates }`
- `searchRadius`: number (km)
- `virtualEventsInterest`: boolean
- `willingToTravel`: boolean

---

### Screen 3B: Organizer Path - Quick Profile

**Shown When:** User selected "Organize events" or "Both"

**Purpose:** Set up basic organizer profile (can be enhanced later)

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●●○○]               [Skip tour →]      │
│                                                     │
│  Tell attendees about you                          │
│  (You can always update this later)                │
│                                                     │
│  Organization/Brand Name (Optional)                │
│  ┌────────────────────────────────────────┐        │
│  │ [Your brand name]                      │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  What you're organizing                            │
│  ┌────────────────────────────────────────┐        │
│  │ [We host monthly tech meetups...]      │        │
│  │                                         │        │
│  │                                         │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  Website (Optional)                                │
│  ┌────────────────────────────────────────┐        │
│  │ [https://]                             │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  💡 Great profiles get 3x more event registrations │
│                                                     │
│  [← Back]              [Skip]     [Continue →]     │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- All fields optional
- Character count for description (max 280)
- URL validation with helpful error messages
- Auto-save as they type

**Data Collected:**
- `organizationName`: string
- `organizerBio`: string
- `organizerWebsite`: string

---

### Screen 4: Combined Path - Feature Tour

**Shown When:** Always shown (unless skipped)

**Purpose:** Highlight key platform features with visual demos

**UI Layout (Carousel):**

**Slide 1/3:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●●●○]               [Skip tour →]      │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │                                     │           │
│  │      [Animated illustration:        │           │
│  │       QR code being scanned         │           │
│  │       with checkmark animation]     │           │
│  │                                     │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  🎟️ Digital Tickets with QR Codes                  │
│                                                     │
│  Your tickets are always with you. Scan            │
│  from your phone or download as PDF.               │
│                                                     │
│  [○○○]                            [Next →]         │
└─────────────────────────────────────────────────────┘
```

**Slide 2/3:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●●●○]               [Skip tour →]      │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │                                     │           │
│  │      [Animated illustration:        │           │
│  │       Notification bell with        │           │
│  │       event reminders popping]      │           │
│  │                                     │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  🔔 Never Miss an Event                            │
│                                                     │
│  Get reminders before events start. Stay           │
│  updated with changes and announcements.           │
│                                                     │
│  [○●○]          [← Back]          [Next →]         │
└─────────────────────────────────────────────────────┘
```

**Slide 3/3:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●●●○]               [Skip tour →]      │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │                                     │           │
│  │      [Animated illustration:        │           │
│  │       Switch between attending &    │           │
│  │       organizing with smooth flip]  │           │
│  │                                     │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ✨ One Account, Endless Possibilities             │
│                                                     │
│  Attend events AND organize them. Switch           │
│  anytime with a single tap.                        │
│                                                     │
│  [○○●]          [← Back]     [Get Started →]       │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Swipe/arrow navigation
- Lottie animations for illustrations
- Auto-advance after 5 seconds (optional)
- Progress dots at bottom

**Data Collected:**
- `tourCompleted`: boolean
- `tourSkippedAt`: screen number (if skipped)

---

### Screen 5: Notification Preferences

**Shown When:** Always shown last (unless skipped entire onboarding)

**Purpose:** Set communication preferences upfront

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Progress: ●●●●●]               [Skip →]           │
│                                                     │
│  📬 How would you like to hear from us?            │
│                                                     │
│  ┌────────────────────────────────────────┐        │
│  │  📧 Email                              │        │
│  │  Event updates and reminders      [●] │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  ┌────────────────────────────────────────┐        │
│  │  📱 Push Notifications                 │        │
│  │  Real-time updates on your phone  [●] │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  ┌────────────────────────────────────────┐        │
│  │  💬 SMS (Optional)                     │        │
│  │  Important event reminders        [○] │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  ┌────────────────────────────────────────┐        │
│  │  📰 Newsletter                         │        │
│  │  Weekly event recommendations     [○] │        │
│  └────────────────────────────────────────┘        │
│                                                     │
│  💡 You can change these anytime in Settings       │
│                                                     │
│  [← Back]                      [Complete Setup →]  │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Toggle switches with smooth animation
- Smart defaults (email + push ON, SMS + newsletter OFF)
- If push is disabled by browser, show explanation

**Data Collected:**
- `notificationPreferences`: Object with channels and types

---

### Screen 6: Completion & Redirect

**Shown When:** User clicks "Complete Setup"

**Purpose:** Celebrate completion and transition to dashboard

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              ┌─────────────────┐                   │
│              │                 │                   │
│              │  [Animated      │                   │
│              │   Checkmark     │                   │
│              │   with party    │                   │
│              │   confetti]     │                   │
│              │                 │                   │
│              └─────────────────┘                   │
│                                                     │
│          🎉 You're all set, [FirstName]!           │
│                                                     │
│      Let's find some amazing events for you        │
│                                                     │
│  [Loading personalized dashboard... ━━━━○○○]       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Interactions:**
- Lottie animation (checkmark + confetti)
- 2-second display, then auto-redirect
- Loading bar with personalization messages:
  - "Finding events near you..."
  - "Loading your personalized feed..."
  - "Almost there..."

**Backend Actions:**
- Mark `onboardingCompleted: true`
- Store all preferences in `user.onboardingPreferences`
- Trigger welcome email
- Pre-fetch personalized event recommendations

---

## Interactive Elements

### Animations & Micro-Interactions

**1. Card Interactions**
```typescript
// Spring animations on hover/focus
const cardVariants = {
  initial: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },
  selected: {
    scale: 1.05,
    boxShadow: "0 0 0 3px rgb(var(--primary))",
    transition: { type: "spring", stiffness: 400, damping: 17 }
  }
};
```

**2. Progress Indicator**
```typescript
// Smooth progress transitions
const progressVariants = {
  initial: { width: "0%" },
  animate: {
    width: `${(currentStep / totalSteps) * 100}%`,
    transition: { type: "spring", duration: 0.5 }
  }
};
```

**3. Confetti Effect**
- Trigger on screen 1 when user selects "Both"
- Trigger on final screen completion
- Use `canvas-confetti` or `react-rewards`

**4. Illustration Animations**
- Lottie JSON animations for feature tour
- Loop smoothly
- Pause when user navigates away

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Continue to next screen |
| `Esc` | Skip onboarding |
| `←` | Go back |
| `→` | Go forward |
| `1-9` | Quick select options (if applicable) |

### Mobile-Specific Interactions

- Swipe gestures for carousel
- Haptic feedback on selection
- Pull-to-refresh if stuck
- Native share sheet integration

---

## Data Collection Strategy

### Database Schema

**Add to User Model:**
```typescript
interface User {
  // ... existing fields
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;
  onboardingSkipped: boolean;
  onboardingPreferences: {
    intent: "attend" | "organize" | "both";
    eventInterests?: string[]; // Category IDs
    organizerEventTypes?: string[];
    location?: {
      city: string;
      country: string;
      coordinates: { lat: number; lng: number };
    };
    searchRadius?: number;
    virtualEventsInterest?: boolean;
    willingToTravel?: boolean;
    organizationName?: string;
    organizerBio?: string;
    organizerWebsite?: string;
    notificationPreferences: {
      email: boolean;
      push: boolean;
      sms: boolean;
      newsletter: boolean;
    };
    tourCompleted: boolean;
    tourSkippedAt?: number;
  };
}
```

### API Endpoints

**Save Onboarding Progress:**
```typescript
POST /api/v1/onboarding/progress
Body: {
  step: number,
  data: Partial<OnboardingPreferences>
}
Response: { success: boolean }
```

**Complete Onboarding:**
```typescript
POST /api/v1/onboarding/complete
Body: {
  preferences: OnboardingPreferences
}
Response: {
  success: boolean,
  personalizedEvents: Event[],
  recommendedCategories: string[]
}
```

**Skip Onboarding:**
```typescript
POST /api/v1/onboarding/skip
Body: { skippedAt: number }
Response: { success: boolean }
```

---

## Implementation Specs

### Web Implementation

**Tech Stack:**
- React + TypeScript
- Framer Motion for animations
- Lottie for illustrations
- Zustand for onboarding state management

**File Structure:**
```
client/src/pages/onboarding/
├── OnboardingLayout.tsx       # Container with progress bar
├── steps/
│   ├── WelcomeStep.tsx        # Screen 1
│   ├── AttendeeInterestsStep.tsx
│   ├── AttendeeLocationStep.tsx
│   ├── OrganizerTypeStep.tsx
│   ├── OrganizerProfileStep.tsx
│   ├── FeatureTourStep.tsx
│   ├── NotificationPrefsStep.tsx
│   └── CompletionStep.tsx
├── components/
│   ├── ProgressBar.tsx
│   ├── InterestBubble.tsx
│   ├── LocationPicker.tsx
│   └── FeatureCard.tsx
└── hooks/
    ├── useOnboardingState.ts
    └── useOnboardingProgress.ts
```

**Example Component:**
```typescript
// steps/WelcomeStep.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export const WelcomeStep = ({ onNext, onSkip }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleSelect = (option: 'attend' | 'organize') => {
    const newSelected = new Set(selected);
    if (newSelected.has(option)) {
      newSelected.delete(option);
    } else {
      newSelected.add(option);
      // Trigger confetti if both selected
      if (newSelected.size === 2) {
        triggerConfetti();
      }
    }
    setSelected(newSelected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* UI content */}
    </motion.div>
  );
};
```

### Mobile Implementation

**Tech Stack:**
- Flutter
- GetX for state management
- Lottie for animations
- flutter_svg for illustrations

**File Structure:**
```
lib/presentation/onboarding/
├── onboarding_layout.dart
├── screens/
│   ├── welcome_screen.dart
│   ├── attendee_interests_screen.dart
│   ├── attendee_location_screen.dart
│   ├── organizer_type_screen.dart
│   ├── organizer_profile_screen.dart
│   ├── feature_tour_screen.dart
│   ├── notification_prefs_screen.dart
│   └── completion_screen.dart
├── widgets/
│   ├── progress_indicator.dart
│   ├── interest_chip.dart
│   ├── location_picker.dart
│   └── feature_card.dart
└── controllers/
    └── onboarding_controller.dart
```

**Example Controller:**
```dart
// controllers/onboarding_controller.dart
class OnboardingController extends GetxController {
  final currentStep = 0.obs;
  final totalSteps = 6;
  final preferences = OnboardingPreferences().obs;

  void saveProgress() async {
    await OnboardingApi.saveProgress(
      step: currentStep.value,
      data: preferences.value.toJson(),
    );
  }

  void nextStep() {
    if (currentStep.value < totalSteps - 1) {
      currentStep.value++;
      saveProgress();
    }
  }

  Future<void> completeOnboarding() async {
    await OnboardingApi.complete(preferences.value);
    Get.offAllNamed('/dashboard');
  }
}
```

---

## Success Metrics

### Completion Metrics

**Target:** 80% completion rate

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Started** | 100% of new users | Auto-triggered after signup |
| **Completed** | 80%+ | Reached final screen |
| **Skipped** | <15% | Clicked "Skip tour" |
| **Abandoned** | <5% | Closed app/browser mid-flow |

### Time Metrics

| Step | Target Time | Max Time |
|------|-------------|----------|
| Screen 1 (Welcome) | 10s | 30s |
| Screen 2 (Interests) | 15s | 45s |
| Screen 3 (Location/Profile) | 20s | 60s |
| Screen 4 (Tour) | 30s | 90s |
| Screen 5 (Notifications) | 10s | 30s |
| **Total** | **85s** | **255s (4min)** |

### Quality Metrics

**Collected Data Quality:**
- [ ] 90%+ users provide location
- [ ] 85%+ users select 3+ interests
- [ ] 70%+ organizers fill profile fields
- [ ] 95%+ users set notification preferences

**Personalization Effectiveness:**
- [ ] 60%+ users engage with recommended events (within 7 days)
- [ ] 40%+ users register for an event (within 14 days)
- [ ] 15%+ organizers create first event (within 30 days)

### A/B Testing Opportunities

**Test Variants:**
1. **Step Count:** 5 steps vs 7 steps
2. **Animations:** Heavy animations vs minimal
3. **Skip Visibility:** Always visible vs hidden on screen 1
4. **Incentives:** "Skip" vs "I'll do this later" vs "Explore now"
5. **Tour Format:** Carousel vs vertical scroll

---

## Related Documentation

- [AUTHENTICATION_MIGRATION.md](./AUTHENTICATION_MIGRATION.md) — Auth flow changes
- [UNIFIED_DASHBOARD_PLAN.md](./UNIFIED_DASHBOARD_PLAN.md) — Overall dashboard strategy
- [TERMINOLOGY_STRATEGY.md](./TERMINOLOGY_STRATEGY.md) — UI terminology

---

**Status:** ✅ READY FOR DESIGN REVIEW

**Next Steps:**
1. Create hi-fi mockups in Figma
2. Build Lottie animations for feature tour
3. Prototype in Framer/React
4. User testing with beta group
5. Iterate based on feedback
6. Implement in production
