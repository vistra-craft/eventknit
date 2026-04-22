import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import {
  ArrowRight,
  Ticket,
  BarChart3,
  Users,
  CalendarDays,
  MapPin,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Logo from '@/components/layout/Logo';

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

// ─── Role cards config ───────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'attendee',
    label: 'Attend Events',
    tagline: 'Discover experiences worth showing up for',
    description: 'Find and register for events that match your interests, from concerts and conferences to workshops and meetups.',
    perks: [
      { icon: CalendarDays, text: 'Browse thousands of events' },
      { icon: Ticket,       text: 'Digital tickets, always accessible' },
      { icon: MapPin,       text: 'Discover events near you' },
    ],
    cta: 'Browse as Attendee',
    href: '/auth/signup',
    accent: 'from-primary to-primary/70',
    accentBg: 'bg-primary/10 dark:bg-primary/15',
    accentText: 'text-primary',
    accentBorder: 'border-primary/30',
    accentRing: 'ring-primary/40',
  },
  {
    id: 'organizer',
    label: 'Host Events',
    tagline: 'Turn your vision into an event people remember',
    description: 'Create events, sell tickets, manage registrations, and grow your audience, all from one place.',
    perks: [
      { icon: Sparkles,  text: 'Guided event creation wizard' },
      { icon: Users,     text: 'Sell tickets and manage attendees' },
      { icon: BarChart3, text: 'Analytics and real-time insights' },
    ],
    cta: 'Start Hosting',
    href: '/auth/register/organizer',
    accent: 'from-emerald-500 to-teal-500',
    accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    accentRing: 'ring-emerald-500/40',
  },
] as const;

// ─── Decorative right panel ──────────────────────────────────────────────────

const RightPanel = () => {
  const [lottieData, setLottieData] = useState<object | null>(null);

  useEffect(() => {
    fetch('/lottie/login.json')
      .then((res) => res.json())
      .then(setLottieData)
      .catch(() => {});
  }, []);

  return (
    <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-background border-l border-border items-center justify-center">

      {/* Top-right diagonal strips */}
      <svg
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
        viewBox="0 0 256 256"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gs-tr-grad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="256" y1="0"  x2="0"   y2="256" stroke="url(#gs-tr-grad)" strokeWidth="1.5" />
        <line x1="256" y1="36" x2="36"  y2="256" stroke="url(#gs-tr-grad)" strokeWidth="1"   />
        <line x1="256" y1="72" x2="72"  y2="256" stroke="url(#gs-tr-grad)" strokeWidth="0.6" />
      </svg>

      {/* Bottom-left diagonal strips */}
      <svg
        className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none rotate-180"
        viewBox="0 0 256 256"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gs-bl-grad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="256" y1="0"  x2="0"   y2="256" stroke="url(#gs-bl-grad)" strokeWidth="1.5" />
        <line x1="256" y1="36" x2="36"  y2="256" stroke="url(#gs-bl-grad)" strokeWidth="1"   />
        <line x1="256" y1="72" x2="72"  y2="256" stroke="url(#gs-bl-grad)" strokeWidth="0.6" />
      </svg>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center px-10 text-center gap-6 w-full max-w-sm">
        {lottieData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
            className="w-full max-w-xs"
          >
            <Lottie animationData={lottieData} loop className="w-full" />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.55 }}
          className="space-y-2"
        >
          <p className="text-base font-semibold text-foreground">
            Your next great event starts here
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Join thousands of organizers and attendees already using EventKnit to discover, create, and experience events.
          </p>
        </motion.div>

        {/* Brand accent strip */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.7 }}
          className="h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 origin-left"
        />
      </div>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

export default function GetStarted() {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = (href: string, id: string) => {
    setSelecting(id);
    // Brief pause so the press state is visible before navigation
    setTimeout(() => navigate(href), 160);
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">

      {/* Global diagonal strips - top-left corner, behind both panels */}
      <svg
        className="absolute top-0 left-0 w-64 h-64 pointer-events-none z-0"
        viewBox="0 0 256 256"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gs-global-tl" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="256" y1="0"  x2="0"   y2="256" stroke="url(#gs-global-tl)" strokeWidth="1.5" />
        <line x1="256" y1="36" x2="36"  y2="256" stroke="url(#gs-global-tl)" strokeWidth="1"   />
        <line x1="256" y1="72" x2="72"  y2="256" stroke="url(#gs-global-tl)" strokeWidth="0.6" />
      </svg>

      {/* ── Left: Choice panel ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10">
        {/* Top bar */}
        <div className="flex items-center px-5 sm:px-10 pt-6 pb-3 shrink-0">
          <Logo />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-6 sm:py-10">
          <div className="w-full max-w-lg">
            {/* Heading */}
            <motion.div
              className="mb-7 sm:mb-10 text-center lg:text-left"
              initial="hidden"
              animate="show"
            >
              <motion.p
                custom={0}
                variants={fadeUp}
                className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2 sm:mb-3"
              >
                Welcome to EventKnit
              </motion.p>
              <motion.h1
                custom={0.08}
                variants={fadeUp}
                className="text-2xl sm:text-4xl font-bold text-foreground leading-tight mb-2 sm:mb-3"
              >
                How would you like to get started?
              </motion.h1>
              <motion.p
                custom={0.16}
                variants={fadeUp}
                className="text-sm sm:text-base text-muted-foreground"
              >
                Pick a path. You can always explore both later.
              </motion.p>
            </motion.div>

            {/* Role cards */}
            <div className="space-y-3 sm:space-y-4">
              {ROLES.map((role, index) => {
                const isSelecting = selecting === role.id;

                return (
                  <motion.button
                    key={role.id}
                    custom={0.25 + index * 0.1}
                    variants={cardVariants}
                    initial="hidden"
                    animate="show"
                    onClick={() => handleSelect(role.href, role.id)}
                    whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
                    className={[
                      'group w-full text-left rounded-2xl border bg-card p-4 sm:p-6',
                      'transition-all duration-200',
                      'shadow-sm hover:shadow-md hover:shadow-black/5 dark:shadow-black/20 dark:hover:shadow-black/30',
                      `hover:${role.accentBorder}`,
                      isSelecting
                        ? `ring-2 ${role.accentRing} ${role.accentBorder} shadow-md`
                        : 'border-border',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2">
                      {/* Accent indent bar */}
                      <div className={`shrink-0 w-1 self-stretch rounded-full ${role.accentBg} border-l-2 ${role.accentBorder}`} />

                      {/* Text */}
                      <div className="flex-1 min-w-0 pl-3">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h2 className="text-base font-semibold text-foreground">
                            {role.label}
                          </h2>
                          <ArrowRight
                            className={`w-4 h-4 shrink-0 transition-all duration-200 ${role.accentText} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5`}
                          />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mb-3">
                          {role.tagline}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                          {role.description}
                        </p>

                        {/* Perks */}
                        <ul className="space-y-1.5">
                          {role.perks.map(({ text }) => (
                            <li key={text} className="flex items-center gap-2">
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${role.accentText}`} />
                              <span className="text-xs text-muted-foreground">{text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* CTA strip */}
                    <div className={`mt-4 pt-4 border-t border-border flex items-center justify-between`}>
                      <span className={`text-sm font-medium ${role.accentText}`}>
                        {role.cta}
                      </span>
                      <div className={`group/cta w-6 h-6 rounded-full bg-gradient-to-br ${role.accent} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <ArrowRight className="w-3 h-3 text-white transition-transform duration-300 ease-in-out group-hover/cta:rotate-90" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Sign in prompt */}
            <motion.div
              custom={0.5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-6 flex items-center justify-center gap-3"
            >
              <div className="h-px flex-1 bg-border" />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/auth/signin')}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </button>
              </p>
              <div className="h-px flex-1 bg-border" />
            </motion.div>

            {/* Footer note */}
            <motion.p
              custom={0.6}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-5 text-center text-xs text-muted-foreground"
            >
              By continuing you agree to our{' '}
              <button onClick={() => navigate('/terms-of-service')} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                Terms of Service
              </button>
              {' '}and{' '}
              <button onClick={() => navigate('/privacy-policy')} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                Privacy Policy
              </button>
            </motion.p>
          </div>
        </div>
      </div>

      {/* ── Right: Brand panel (desktop only) ──────────────────── */}
      <RightPanel />
    </div>
  );
}
