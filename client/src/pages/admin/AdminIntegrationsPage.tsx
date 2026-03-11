import { useState } from "react";
import {
  SiGmail,
  SiCloudinary,
  SiStripe,
  SiTwilio,
  SiWhatsapp,
  SiFirebase,
  SiX,
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiGoogle,
  SiApple,
  SiRedis,
} from "react-icons/si";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  Power,
  Activity,
  Plug,
  PlugZap,
  Settings2,
  ExternalLink,
  AlertTriangle,
  HardDrive,
  Network,
  Terminal,
  Layers,
  Mail,
  Cloud,
  CreditCard,
  MessageSquare,
  Globe,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Custom logo imports (brands not in react-icons)
import contaboLogo from "@/assets/integrations/contabo.svg";
import africastalkingLogo from "@/assets/integrations/africastalking.svg";
import bullmqLogo from "@/assets/integrations/bullmq.svg";
import mpesaLogo from "@/assets/integrations/mpesa.svg";
import linkedinLogo from "@/assets/integrations/linkedin.svg";
import paystackLogo from "@/assets/integrations/paystack.svg";

// ─── Types ────────────────────────────────────────────────────────────────────

type IntegrationStatus = "connected" | "not_configured" | "error" | "unknown";
type IntegrationCategory =
  | "all"
  | "email"
  | "storage"
  | "payments"
  | "messaging"
  | "notifications"
  | "social"
  | "auth"
  | "infrastructure";

// A logo is either a react-icons component, an SVG image URL, or a lucide icon
type LogoType =
  | { kind: "si"; component: React.ElementType; color: string }
  | { kind: "img"; src: string }
  | { kind: "lucide"; component: React.ElementType; iconBg: string; iconColor: string };

interface Integration {
  id: string;
  name: string;
  category: Exclude<IntegrationCategory, "all">;
  description: string;
  envVars: string[];
  status: IntegrationStatus;
  docsUrl?: string;
  logo: LogoType;
  badge?: string;
}

// ─── Integration Registry ─────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  // Email
  {
    id: "smtp",
    name: "SMTP / Gmail",
    category: "email",
    description:
      "Transactional emails — registration confirmations, tickets, password resets.",
    envVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"],
    status: "unknown",
    logo: { kind: "si", component: SiGmail, color: "#EA4335" },
    docsUrl: "https://nodemailer.com/smtp/",
  },

  // Cloud Storage
  {
    id: "cloudinary",
    name: "Cloudinary",
    category: "storage",
    description:
      "Image uploads, on-the-fly transformations, and CDN delivery for event media.",
    envVars: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    status: "unknown",
    logo: { kind: "si", component: SiCloudinary, color: "#3448C5" },
    docsUrl: "https://cloudinary.com/documentation",
  },

  // Payments
  {
    id: "paystack",
    name: "Paystack",
    category: "payments",
    description:
      "Card and bank payments for Nigeria, Kenya, Ghana, and South Africa.",
    envVars: ["PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY", "PAYSTACK_WEBHOOK_SECRET"],
    status: "unknown",
    logo: { kind: "img", src: paystackLogo },
    docsUrl: "https://paystack.com/docs",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    description:
      "Global credit and debit card processing with webhook support.",
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_PUBLIC_KEY", "STRIPE_WEBHOOK_SECRET"],
    status: "unknown",
    badge: "Test Mode",
    logo: { kind: "si", component: SiStripe, color: "#635BFF" },
    docsUrl: "https://stripe.com/docs",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    category: "payments",
    description:
      "Kenya mobile money via Safaricom Daraja API — STK Push and C2B.",
    envVars: [
      "MPESA_CONSUMER_KEY",
      "MPESA_CONSUMER_SECRET",
      "MPESA_PASSKEY",
      "MPESA_SHORTCODE",
      "MPESA_CALLBACK_URL",
    ],
    status: "unknown",
    badge: "Sandbox",
    logo: { kind: "img", src: mpesaLogo },
    docsUrl: "https://developer.safaricom.co.ke",
  },

  // Messaging
  {
    id: "twilio",
    name: "Twilio SMS",
    category: "messaging",
    description:
      "OTP codes, payment alerts, event reminders, and security notifications via SMS.",
    envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    status: "unknown",
    logo: { kind: "si", component: SiTwilio, color: "#F22F46" },
    docsUrl: "https://www.twilio.com/docs",
  },
  {
    id: "africastalking",
    name: "Africa's Talking",
    category: "messaging",
    description:
      "USSD menu sessions and bulk SMS for African mobile networks.",
    envVars: ["AT_API_KEY", "AT_USERNAME"],
    status: "unknown",
    logo: { kind: "img", src: africastalkingLogo },
    docsUrl: "https://africastalking.com/docs",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "messaging",
    description:
      "Send event updates and ticket confirmations via WhatsApp Business API.",
    envVars: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_WEBHOOK_SECRET"],
    status: "unknown",
    logo: { kind: "si", component: SiWhatsapp, color: "#25D366" },
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
  },

  // Push Notifications
  {
    id: "webpush",
    name: "Web Push (VAPID)",
    category: "notifications",
    description:
      "Browser push notifications for desktop and mobile web attendees.",
    envVars: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
    status: "unknown",
    logo: { kind: "lucide", component: Bell, iconBg: "bg-blue-500/10", iconColor: "text-blue-500" },
    docsUrl: "https://web.dev/push-notifications-overview/",
  },
  {
    id: "firebase",
    name: "Firebase FCM",
    category: "notifications",
    description:
      "Mobile push notifications for iOS and Android apps via Firebase Cloud Messaging.",
    envVars: ["FIREBASE_SERVICE_ACCOUNT"],
    status: "unknown",
    logo: { kind: "si", component: SiFirebase, color: "#FFCA28" },
    docsUrl: "https://firebase.google.com/docs/cloud-messaging",
  },

  // Social Media
  {
    id: "twitter",
    name: "X (Twitter)",
    category: "social",
    description:
      "Publish event announcements and updates to X via OAuth 2.0 PKCE.",
    envVars: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "TWITTER_REDIRECT_URI"],
    status: "unknown",
    logo: { kind: "si", component: SiX, color: "#000000" },
    docsUrl: "https://developer.twitter.com/en/docs",
  },
  {
    id: "facebook",
    name: "Facebook",
    category: "social",
    description:
      "Post events to Facebook Pages and sync attendee data.",
    envVars: ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET", "FACEBOOK_REDIRECT_URI"],
    status: "unknown",
    logo: { kind: "si", component: SiFacebook, color: "#1877F2" },
    docsUrl: "https://developers.facebook.com/docs",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    description:
      "Share event highlights and stories on Instagram.",
    envVars: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET", "INSTAGRAM_REDIRECT_URI"],
    status: "unknown",
    logo: { kind: "si", component: SiInstagram, color: "#E4405F" },
    docsUrl: "https://developers.facebook.com/docs/instagram",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "social",
    description:
      "Professional event promotion and attendee outreach on LinkedIn.",
    envVars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_REDIRECT_URI"],
    status: "unknown",
    logo: { kind: "img", src: linkedinLogo },
    docsUrl: "https://developer.linkedin.com/docs",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    description:
      "Share event short-form video content on TikTok.",
    envVars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
    status: "unknown",
    logo: { kind: "si", component: SiTiktok, color: "#000000" },
    docsUrl: "https://developers.tiktok.com/doc",
  },

  // Auth / OAuth
  {
    id: "google_oauth",
    name: "Google OAuth",
    category: "auth",
    description:
      "Sign in with Google — verifies Google ID tokens for attendee and organizer login.",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    status: "unknown",
    logo: { kind: "si", component: SiGoogle, color: "#4285F4" },
    docsUrl: "https://developers.google.com/identity",
  },
  {
    id: "apple",
    name: "Apple Sign In",
    category: "auth",
    description:
      "Sign in with Apple ID — supports iOS and web authentication.",
    envVars: ["APPLE_CLIENT_ID", "APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY_PATH"],
    status: "unknown",
    logo: { kind: "si", component: SiApple, color: "#000000" },
    docsUrl: "https://developer.apple.com/sign-in-with-apple/",
  },

  // Infrastructure
  {
    id: "redis",
    name: "Redis",
    category: "infrastructure",
    description:
      "In-memory store for ticket inventory locks, session caching, and BullMQ job queues.",
    envVars: ["REDIS_URL"],
    status: "unknown",
    logo: { kind: "si", component: SiRedis, color: "#FF4438" },
    docsUrl: "https://redis.io/docs/latest/",
  },
  {
    id: "bullmq",
    name: "BullMQ",
    category: "infrastructure",
    description:
      "Async job queues for PDF ticket generation, email sending, and background tasks.",
    envVars: ["REDIS_URL"],
    status: "unknown",
    logo: { kind: "img", src: bullmqLogo },
    docsUrl: "https://docs.bullmq.io",
  },
];

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORIES: { id: IntegrationCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Plug },
  { id: "email", label: "Email", icon: Mail },
  { id: "storage", label: "Storage", icon: Cloud },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "social", label: "Social Media", icon: Globe },
  { id: "auth", label: "Auth / OAuth", icon: Settings2 },
  { id: "infrastructure", label: "Infrastructure", icon: Layers },
];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  IntegrationStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  connected: {
    label: "Connected",
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  not_configured: {
    label: "Not Configured",
    dotClass: "bg-zinc-400",
    badgeClass: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
  error: {
    label: "Error",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  unknown: {
    label: "Not Checked",
    dotClass: "bg-amber-400",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

// ─── Logo renderer ────────────────────────────────────────────────────────────

const IntegrationLogo = ({ logo, size = 22 }: { logo: LogoType; size?: number }) => {
  if (logo.kind === "si") {
    const Icon = logo.component;
    // Wrap in a neutral container so the brand color shows on both light/dark
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-border/20">
        <Icon size={size} color={logo.color} />
      </div>
    );
  }

  if (logo.kind === "img") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-sm border border-border/20">
        <img src={logo.src} alt="logo" className="h-full w-full object-cover" />
      </div>
    );
  }

  // Lucide fallback
  const Icon = logo.component;
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-xl ${logo.iconBg}`}
    >
      <Icon className={`h-5 w-5 ${logo.iconColor}`} />
    </div>
  );
};

// ─── Env var tag ──────────────────────────────────────────────────────────────

const EnvVarTag = ({ name }: { name: string }) => {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(name);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="group inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {name}
      {copied ? (
        <Check className="h-2.5 w-2.5 text-emerald-500" />
      ) : (
        <Copy className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
};

// ─── Integration card ─────────────────────────────────────────────────────────

const IntegrationCard = ({ integration }: { integration: Integration }) => {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[integration.status];

  return (
    <div className="group flex flex-col rounded-2xl border border-border/40 bg-card p-5 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <IntegrationLogo logo={integration.logo} />

        <div className="flex flex-col items-end gap-1.5">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusCfg.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`} />
            {statusCfg.label}
          </div>
          {integration.badge && (
            <span className="rounded-full border border-border/40 bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {integration.badge}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mt-3 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {integration.description}
        </p>
      </div>

      {/* Env vars */}
      <div className="mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>
            {integration.envVars.length} env var
            {integration.envVars.length !== 1 ? "s" : ""} required
          </span>
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {expanded && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {integration.envVars.map((v) => (
              <EnvVarTag key={v} name={v} />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 flex-1 text-xs"
          disabled
        >
          <RefreshCw className="mr-1.5 h-3 w-3" />
          Test Connection
        </Button>
        {integration.docsUrl && (
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Infrastructure tab ───────────────────────────────────────────────────────

const InfrastructureTab = () => (
  <div className="space-y-6">
    {/* Contabo */}
    <Card className="border-border/40 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden border border-border/20 shadow-sm">
            <img src={contaboLogo} alt="Contabo" className="h-full w-full object-cover" />
          </div>
          <div>
            <CardTitle className="text-base">Contabo VPS</CardTitle>
            <p className="text-xs text-muted-foreground">
              Manage your Contabo server instances from this dashboard
            </p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Not Configured
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Client ID</Label>
            <Input placeholder="CONTABO_CLIENT_ID" disabled className="h-8 font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client Secret</Label>
            <Input type="password" placeholder="CONTABO_CLIENT_SECRET" disabled className="h-8 font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">API Username</Label>
            <Input placeholder="CONTABO_API_USER" disabled className="h-8 font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">API Password</Label>
            <Input type="password" placeholder="CONTABO_API_PASSWORD" disabled className="h-8 font-mono text-xs" />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-muted-foreground">
            Set{" "}
            <code className="font-mono text-amber-600 dark:text-amber-400">
              CONTABO_*
            </code>{" "}
            environment variables on the server to enable VPS management.
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="h-8 text-xs" disabled>
            <PlugZap className="mr-1.5 h-3.5 w-3.5" />
            Connect Contabo
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" disabled>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Test Credentials
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Server instances */}
    <Card className="border-border/40 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Server Instances</CardTitle>
        <p className="text-xs text-muted-foreground">
          Your Contabo VPS instances will appear here once credentials are configured
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">No servers connected</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Configure Contabo API credentials above to view and manage server instances
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Server actions */}
    <Card className="border-border/40 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Server Actions</CardTitle>
        <p className="text-xs text-muted-foreground">
          Common administrative operations — requires Contabo to be connected
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: RefreshCw, label: "Restart Application", desc: "Restart the Node.js server process", color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: Power, label: "Reboot VPS", desc: "Full server reboot via Contabo API", color: "text-orange-500", bg: "bg-orange-500/10" },
            { icon: Activity, label: "Server Metrics", desc: "CPU, memory and disk usage", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: Terminal, label: "View Logs", desc: "Recent application and error logs", color: "text-violet-500", bg: "bg-violet-500/10" },
            { icon: HardDrive, label: "Snapshot", desc: "Create a VPS snapshot backup", color: "text-sky-500", bg: "bg-sky-500/10" },
            { icon: Network, label: "Network Info", desc: "IP addresses and bandwidth usage", color: "text-amber-500", bg: "bg-amber-500/10" },
          ].map((action) => (
            <button
              key={action.label}
              disabled
              className="flex cursor-not-allowed items-start gap-3 rounded-xl border border-border/40 bg-muted/30 p-3 text-left opacity-60 transition-all"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.bg}`}>
                <action.icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Actions are disabled — connect Contabo to enable server management
        </p>
      </CardContent>
    </Card>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminIntegrationsPage = () => {
  const [activeTab, setActiveTab] = useState<"integrations" | "infrastructure">(
    "integrations"
  );
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory>("all");

  const filtered =
    activeCategory === "all"
      ? INTEGRATIONS
      : INTEGRATIONS.filter((i) => i.category === activeCategory);

  const stats = [
    {
      label: "Total Integrations",
      value: INTEGRATIONS.length,
      icon: Plug,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Connected",
      value: INTEGRATIONS.filter((i) => i.status === "connected").length,
      icon: PlugZap,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Not Configured",
      value: INTEGRATIONS.filter((i) => i.status === "not_configured").length,
      icon: AlertTriangle,
      gradient: "from-zinc-500 to-zinc-600",
    },
    {
      label: "Categories",
      value: CATEGORIES.length - 1,
      icon: Layers,
      gradient: "from-violet-500 to-violet-600",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all third-party services and infrastructure connected to EventKnit
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled>
          <RefreshCw className="h-3.5 w-3.5" />
          Check All Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r ${stat.gradient}`}
                >
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl border border-border/40 bg-muted/50 p-1">
        {(["integrations", "infrastructure"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "infrastructure" ? "Infrastructure & Server" : "Integrations"}
          </button>
        ))}
      </div>

      {activeTab === "integrations" && (
        <div className="space-y-5">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              const count =
                cat.id === "all"
                  ? INTEGRATIONS.length
                  : INTEGRATIONS.filter((i) => i.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    activeCategory === cat.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/40 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <CatIcon className="h-3 w-3" />
                  {cat.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      activeCategory === cat.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status legend */}
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
                {cfg.label}
              </span>
            ))}
            <span className="text-muted-foreground/60">
              · Live status requires backend connection check
            </span>
          </div>

          {/* Cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </div>
      )}

      {activeTab === "infrastructure" && <InfrastructureTab />}
    </div>
  );
};

export default AdminIntegrationsPage;
