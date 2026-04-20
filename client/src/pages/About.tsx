import { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Calendar, Ticket, QrCode, BarChart3, ArrowRight, CheckCircle2,
  Users, Globe, Star, Shield, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { TiltCard } from "@/components/ui/TiltCard";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { EASE } from "@/lib/animation-constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";

// Images
import heroImg from "@/assets/about/hero-conference.jpg";
import energyImg from "@/assets/about/event-energy.jpg";
import buildSomethingImg from "@/assets/about/build_something.jpg";
import africaMapImg from "@/assets/about/africa-dotted.png";

// Partner logos
import logoSafaricom from "@/assets/integrations/safaricom.svg";
import logoMpesa from "@/assets/integrations/mpesa.svg";
import logoEABL from "@/assets/integrations/eabl.svg";
import logoVisa from "@/assets/integrations/visa.svg";
import logoMastercard from "@/assets/integrations/mastercard.svg";
import logoStripe from "@/assets/integrations/stripe.svg";
import logoPaystack from "@/assets/integrations/paystack.svg";
import logoAT from "@/assets/integrations/africastalking.svg";
import logoLinkedIn from "@/assets/integrations/linkedin.svg";

const PARTNERS = [
  { name: "Safaricom", logo: logoSafaricom },
  { name: "M-Pesa", logo: logoMpesa },
  { name: "EABL", logo: logoEABL },
  { name: "Visa", logo: logoVisa },
  { name: "Mastercard", logo: logoMastercard },
  { name: "Stripe", logo: logoStripe },
  { name: "Paystack", logo: logoPaystack },
  { name: "Africa's Talking", logo: logoAT },
  { name: "LinkedIn", logo: logoLinkedIn },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------


const HERO_WORDS = ["Event", "management", "that", "connects", "people"];

const STATS = [
  { value: 10000, suffix: "+", label: "Events Created", icon: Calendar },
  { value: 500, suffix: "K+", label: "Tickets Sold", icon: Ticket },
  { value: 50, suffix: "+", label: "Countries", icon: Globe },
  { value: 4.9, suffix: "", label: "Average Rating", decimals: 1, icon: Star },
];

const FEATURES = [
  {
    icon: Calendar,
    title: "Create Events",
    tagline: "From idea to live in minutes",
    description: "Design stunning event pages with custom ticket tiers, schedules, venue maps, and branding. Multi-day, multi-session, and recurring events all supported out of the box.",
    highlights: ["Drag-and-drop event builder", "Custom ticket types & pricing", "Venue & seating configuration"],
    color: "bg-primary/10 text-primary",
    accentClass: "text-primary",
    glowClass: "shadow-primary/40",
    dotBg: "bg-primary",
  },
  {
    icon: Ticket,
    title: "Sell Tickets",
    tagline: "Secure payments, instant delivery",
    description: "Accept payments via Stripe, Paystack, and M-Pesa. Tickets are delivered instantly with QR codes, calendar invites, and PDF attachments.",
    highlights: ["Multi-currency & multi-gateway", "Promo codes & group discounts", "Automatic PDF ticket delivery"],
    color: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
    accentClass: "text-orange-500 dark:text-orange-400",
    glowClass: "shadow-orange-500/40",
    dotBg: "bg-orange-500",
  },
  {
    icon: QrCode,
    title: "Check-in",
    tagline: "Scan anywhere, even offline",
    description: "Our mobile app scans QR tickets in milliseconds with cryptographic verification that works without an internet connection. Scans sync automatically when back online.",
    highlights: ["Offline-capable with Ed25519 signatures", "Staff roles: scanner, support, manager", "Real-time check-in dashboard"],
    color: "bg-emerald-500/10 text-emerald-500",
    accentClass: "text-emerald-500",
    glowClass: "shadow-emerald-500/40",
    dotBg: "bg-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Track Everything",
    tagline: "Data-driven decisions, in real time",
    description: "Monitor sales velocity, attendance patterns, revenue breakdowns, and attendee demographics as they happen. Export reports or drill into the details.",
    highlights: ["Live sales & attendance dashboards", "Revenue & payout analytics", "Post-event performance reports"],
    color: "bg-violet-500/10 text-violet-500",
    accentClass: "text-violet-500",
    glowClass: "shadow-violet-500/40",
    dotBg: "bg-violet-500",
  },
];

const AFRICA_CITIES = [
  { name: "Nairobi", x: 67, y: 48, delay: 0 },
  { name: "Lagos", x: 32, y: 42, delay: 0.2 },
  { name: "Johannesburg", x: 55, y: 78, delay: 0.4 },
  { name: "Accra", x: 28, y: 44, delay: 0.6 },
  { name: "Cairo", x: 58, y: 18, delay: 0.8 },
  { name: "Kigali", x: 60, y: 50, delay: 1.0 },
  { name: "Dar es Salaam", x: 68, y: 56, delay: 1.2 },
  { name: "Cape Town", x: 44, y: 85, delay: 1.4 },
];

const ORGANIZER_BENEFITS = [
  "Multi-tier ticket pricing & promo codes",
  "Real-time sales & attendance dashboards",
  "Staff management with role-based access",
  "Automated email confirmations & reminders",
  "Payout tracking & financial reporting",
];

const ATTENDEE_BENEFITS = [
  "Discover events by interest & location",
  "Secure mobile tickets with QR codes",
  "Transfer or resell tickets easily",
  "Get notified about events you'll love",
  "One dashboard for all your events",
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useCountUp(end: number, duration = 2000, decimals = 0) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end, duration, decimals]);

  return { count, ref };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatItem({ value, suffix, label, decimals = 0, index }: { value: number; suffix: string; label: string; decimals?: number; index: number; icon: typeof Calendar }) {
  const { count, ref } = useCountUp(value, 2000, decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.1 }}
      className="text-center py-6 sm:py-8"
    >
      <span ref={ref} className="block text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
        {decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}{suffix}
      </span>
      <span className="text-xs sm:text-sm text-muted-foreground mt-1 block">{label}</span>
    </motion.div>
  );
}


/** Feature card content (reused across layouts) */
function FeatureCard({ feature, isInView }: { feature: typeof FEATURES[number]; isInView: boolean }) {
  return (
    <TiltCard className="group p-5 sm:p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${feature.color}`}>
          <feature.icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{feature.title}</h3>
          <p className={`text-xs font-medium ${feature.accentClass} mt-0.5`}>{feature.tagline}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
      <ul className="space-y-2">
        {feature.highlights.map((h, hi) => (
          <motion.li
            key={h}
            initial={{ opacity: 0, x: 12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, ease: EASE, delay: 0.35 + hi * 0.08 }}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${feature.accentClass}`} />
            {h}
          </motion.li>
        ))}
      </ul>
    </TiltCard>
  );
}

/** Timeline node for the center-spine zigzag (lg) and left-spine (mobile) */
function TimelineNode({ feature, index, total }: { feature: typeof FEATURES[number]; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const isLast = index === total - 1;
  const isLeft = index % 2 === 0; // even = card on left, odd = card on right

  return (
    <div ref={ref}>
      {/* ── Mobile / tablet: left-spine layout ── */}
      <div className="lg:hidden relative grid grid-cols-[40px_1fr] sm:grid-cols-[48px_1fr] gap-4 sm:gap-5">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
            className="relative z-10 shrink-0"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: [0, 0.6, 0.3], scale: [0.5, 1.8, 1.5] } : {}}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className={`absolute inset-0 rounded-full blur-md ${feature.dotBg} opacity-30`}
            />
            <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 border-background ${feature.dotBg}`}>
              <feature.icon className="w-4 h-4 text-white" />
            </div>
          </motion.div>
          {!isLast && (
            <div className="relative w-px flex-1 min-h-[24px] bg-border/50">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
                className={`absolute inset-0 origin-top ${feature.dotBg} opacity-30`}
              />
            </div>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          className={isLast ? "" : "pb-8"}
        >
          <FeatureCard feature={feature} isInView={isInView} />
        </motion.div>
      </div>

      {/* ── Desktop: center-spine zigzag ── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_48px_1fr] gap-6 items-start">
        {/* Left card (even indices) or empty spacer */}
        <div className={isLeft ? "" : "hidden lg:block"}>
          {isLeft && (
            <motion.div
              initial={{ opacity: 0, x: -30, filter: "blur(6px)" }}
              animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
              className={isLast ? "" : "pb-6"}
            >
              <FeatureCard feature={feature} isInView={isInView} />
            </motion.div>
          )}
        </div>

        {/* Center spine: dot + line */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
            className="relative z-10 shrink-0"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: [0, 0.6, 0.3], scale: [0.5, 1.8, 1.5] } : {}}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className={`absolute inset-0 rounded-full blur-md ${feature.dotBg} opacity-30`}
            />
            <div className={`relative w-11 h-11 rounded-full flex items-center justify-center border-2 border-background ${feature.dotBg}`}>
              <feature.icon className="w-5 h-5 text-white" />
            </div>
          </motion.div>
          {!isLast && (
            <div className="relative w-px flex-1 min-h-[40px] bg-border/50">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
                className={`absolute inset-0 origin-top ${feature.dotBg} opacity-30`}
              />
            </div>
          )}
        </div>

        {/* Right card (odd indices) or empty spacer */}
        <div className={!isLeft ? "" : "hidden lg:block"}>
          {!isLeft && (
            <motion.div
              initial={{ opacity: 0, x: 30, filter: "blur(6px)" }}
              animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
              className={isLast ? "" : "pb-6"}
            >
              <FeatureCard feature={feature} isInView={isInView} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Full features timeline section */
function FeatureTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80%", "end 60%"],
  });
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 px-6 bg-muted/20 relative overflow-hidden">
      <div className="container mx-auto max-w-2xl lg:max-w-5xl">
        <AnimatedSection>
          <div className="text-center mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Everything you need
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              A complete toolkit for modern event management, from creation to post-event analytics.
            </p>
          </div>
        </AnimatedSection>

        <div className="relative">
          {/* Background rail */}
          <div className="absolute left-[19px] sm:left-[23px] lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-px bg-border/40" />

          {/* Animated gradient fill */}
          <motion.div
            className="absolute left-[19px] sm:left-[23px] lg:left-1/2 lg:-translate-x-px top-0 w-px origin-top bg-gradient-to-b from-primary via-orange-500 to-violet-500"
            style={{ height: progressHeight }}
          />

          {/* Feature nodes */}
          {FEATURES.map((feature, i) => (
            <TimelineNode key={feature.title} feature={feature} index={i} total={FEATURES.length} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Partners section: text + partner logos left, Africa map right */
function PartnersShowcase() {
  const mapRef = useRef<HTMLDivElement>(null);
  const isMapInView = useInView(mapRef, { once: true, margin: "-80px" });

  return (
    <section className="py-20 sm:py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-primary/[0.03] dark:bg-primary/[0.06] blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: text + partner grid */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Trusted by teams{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                across the continent
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              We partner with industry leaders to bring you secure payments, reliable infrastructure, and seamless communication.
            </p>

            {/* Partner logos marquee: two rows, opposite directions */}
            <div className="mt-8 space-y-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              {/* Row 1: scrolls right */}
              <div className="flex gap-3 animate-[marquee-right_30s_linear_infinite] w-max">
                {[...PARTNERS, ...PARTNERS].map((partner, i) => (
                  <div
                    key={`r1-${i}`}
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl border border-border bg-card flex items-center justify-center p-2 hover:border-primary/30 hover:shadow-md transition-all cursor-default"
                    title={partner.name}
                  >
                    <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain rounded-lg" />
                  </div>
                ))}
              </div>

              {/* Row 2: scrolls left */}
              <div className="flex gap-3 animate-[marquee-left_30s_linear_infinite] w-max">
                {[...PARTNERS, ...PARTNERS].reverse().map((partner, i) => (
                  <div
                    key={`r2-${i}`}
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl border border-border bg-card flex items-center justify-center p-2 hover:border-primary/30 hover:shadow-md transition-all cursor-default"
                    title={partner.name}
                  >
                    <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-4 text-xs text-muted-foreground"
            >
              And more integrations coming. Stripe, Firebase, Twilio, and beyond.
            </motion.p>
          </motion.div>

          {/* Right: dotted Africa map with city markers */}
          <div ref={mapRef} className="relative w-full max-w-[400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: EASE }}
              className="relative"
            >
              <img
                src={africaMapImg}
                alt="Map of Africa"
                className="w-full h-auto dark:invert dark:opacity-80"
              />

              {/* City markers overlaid on the map */}
              {AFRICA_CITIES.map((city) => (
                <motion.div
                  key={city.name}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isMapInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.6 + city.delay }}
                >
                  <motion.div
                    className="absolute w-5 h-5 rounded-full bg-primary/20"
                    animate={isMapInView ? { scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: city.delay }}
                  />
                  <div className="relative w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                  <span className="mt-1 text-[8px] sm:text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {city.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Tagline below map */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={isMapInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE, delay: 1.2 }}
              className="mt-6 text-center text-sm sm:text-base font-semibold text-foreground"
            >
              Born in{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Africa
              </span>
              , built for the world
            </motion.p>
          </div>

        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const About = () => {
  const navigate = useNavigate();

  // Hero parallax
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />

      {/* ── Hero — parallax image + word-by-word reveal ─────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[650px] flex items-center justify-center overflow-hidden"
      >
        {/* Parallax background image */}
        <motion.img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-[130%] object-cover -top-[15%]"
          style={{ y: heroImgY }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />

        {/* Ambient glows */}
        <AmbientGlow className="w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-primary/20 -top-32 -left-24 sm:-top-48 sm:-left-32 z-[1]" duration={30} />
        <AmbientGlow className="w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-orange-500/15 -bottom-24 -right-16 sm:-bottom-32 sm:-right-24 z-[1]" duration={35} delay={5} />

        {/* Content with parallax + fade */}
        <motion.div
          className="relative z-10 max-w-3xl mx-auto text-center px-6 py-24 sm:py-32"
          style={{ y: heroContentY, opacity: heroOpacity }}
        >
          {/* Word-by-word headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-tight flex flex-wrap justify-center gap-x-[0.3em]">
            {HERO_WORDS.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.08 }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
            className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl mx-auto"
          >
            EventKnit helps organizers create, sell, and manage unforgettable events, and helps
            attendees discover what's happening around them. Fast, secure, and built for everyone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="lg" onClick={() => navigate("/auth/register/organizer")}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white"
              onClick={() => navigate("/")}
            >
              Browse Events
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────── */}
      <section className="hidden border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {STATS.map((stat, i) => (
              <StatItem key={stat.label} {...stat} decimals={stat.decimals ?? 0} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Overview ──────────────────────────────────── */}
      <AnimatedSection className="py-20 sm:py-28 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                What is <span className="text-primary">EventKnit</span>?
              </h2>
              <p className="mt-4 text-muted-foreground">
                EventKnit is a full-stack event management platform that connects organizers
                with attendees. From intimate workshops to large-scale conferences, we provide
                the tools to plan, promote, and execute events seamlessly.
              </p>
              <p className="mt-3 text-muted-foreground">
                Our platform handles ticketing, check-ins, real-time analytics, staff coordination,
                and attendee communication so organizers can focus on creating great experiences.
              </p>
            </motion.div>

            {/* Interactive icon composition with tilt */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Shield, label: "Secure", color: "bg-primary/10 text-primary" },
                { icon: Zap, label: "Fast", color: "bg-orange-500/10 text-orange-500 dark:text-orange-400" },
                { icon: Globe, label: "Global", color: "bg-emerald-500/10 text-emerald-500" },
                { icon: Users, label: "Collaborative", color: "bg-violet-500/10 text-violet-500" },
              ].map((item) => (
                <TiltCard
                  key={item.label}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-colors cursor-default"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </TiltCard>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Features — scroll-activated timeline ────────────── */}
      <FeatureTimeline />

      {/* ── Partners — globe + Africa map ─────────────────────── */}
      <PartnersShowcase />

      {/* ── For Organizers / For Attendees ──────────────────────── */}
      <section className="py-20 sm:py-28 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Built for everyone
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Whether you're running the show or attending one, EventKnit has you covered.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organizers card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <TiltCard className="group p-6 sm:p-8 rounded-2xl border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col h-full">
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary/50 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-1">For Organizers</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Everything you need to launch and manage successful events.
                </p>
                <ul className="space-y-3 flex-1">
                  {ORGANIZER_BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </motion.div>

            {/* Attendees card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            >
              <TiltCard className="group p-6 sm:p-8 rounded-2xl border border-border bg-card hover:shadow-lg hover:shadow-orange-500/5 transition-all flex flex-col h-full">
                <div className="h-1 w-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-500/50 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-1">For Attendees</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Discover, book, and enjoy events with zero friction.
                </p>
                <ul className="space-y-3 flex-1">
                  {ATTENDEE_BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-orange-500 dark:text-orange-400 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA — parallax image background ────────────────────── */}
      <section className="relative min-h-[360px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
        <img
          src={buildSomethingImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/75" />

        <AnimatedSection className="relative z-10 max-w-lg mx-auto text-center px-6 py-20 sm:py-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to create something{" "}
            <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
              unforgettable
            </span>
            ?
          </h2>
          <p className="mt-3 text-white/75">
            Join thousands of organizers already using EventKnit to bring events to life.
          </p>
          <motion.div
            className="mt-8 inline-block"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button size="lg" onClick={() => navigate("/auth/register/organizer")}>
              Create Your First Event
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </AnimatedSection>
      </section>

      <Footer />
    </div>
  );
};

export default About;
