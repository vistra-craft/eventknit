import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Shield,
  Eye,
  Crown,
  HeadphonesIcon,
  Monitor,
  Users,
  UserCheck,
  Ticket,
  ChevronRight,
  Check,
  X,
  Save,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getRoles, type RoleInfo } from "@/lib/admin-api";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types/auth";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/constants/roleLabels";
import { roleHierarchy, roleCreationRules } from "@/types/permissions";

// ─── Permission Category & Access Definitions ────────────────────────────────

export interface PageAccess {
  id: string;
  label: string;
  /** "full" = read+write, "read" = view-only, "none" = no access */
  level: "full" | "read" | "none";
}

export interface PermissionCategory {
  id: string;
  label: string;
  pages: PageAccess[];
}

/** Pre-determined RBAC defaults based on industry standards */
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionCategory[]> = {
  [UserRole.SUPERADMIN]: [
    {
      id: "system",
      label: "System",
      pages: [
        { id: "system_health", label: "System Health", level: "full" },
        { id: "system_database", label: "Database", level: "full" },
        { id: "system_logs", label: "Logs", level: "full" },
        { id: "system_backups", label: "Backups", level: "full" },
        { id: "system_maintenance", label: "Maintenance", level: "full" },
      ],
    },
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "dashboard_view", label: "Admin Dashboard", level: "full" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "events_all", label: "All Events", level: "full" },
        { id: "events_pending", label: "Pending Approval", level: "full" },
        { id: "events_featured", label: "Featured Events", level: "full" },
        { id: "events_moderation", label: "Moderation", level: "full" },
      ],
    },
    {
      id: "users",
      label: "Users",
      pages: [
        { id: "users_all", label: "All Users", level: "full" },
        { id: "users_staff", label: "Staff Management", level: "full" },
        { id: "users_roles", label: "User Roles", level: "full" },
        { id: "users_performance", label: "Staff Performance", level: "full" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      pages: [
        { id: "finance_dashboard", label: "Finance Dashboard", level: "full" },
        { id: "finance_payments", label: "Payments", level: "full" },
        { id: "finance_disbursements", label: "Disbursements", level: "full" },
        { id: "finance_refunds", label: "Refunds", level: "full" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      pages: [
        { id: "analytics_platform", label: "Platform Analytics", level: "full" },
        { id: "analytics_revenue", label: "Revenue Analytics", level: "full" },
      ],
    },
    {
      id: "support",
      label: "Support & Marketing",
      pages: [
        { id: "support_services", label: "Support Services", level: "full" },
        { id: "support_communications", label: "Communications", level: "full" },
        { id: "support_feedback", label: "Platform Feedback", level: "full" },
        { id: "support_flagged", label: "Flagged Events", level: "full" },
        { id: "marketing_social", label: "Social Media", level: "full" },
        { id: "marketing_whitelabel", label: "White Label", level: "full" },
      ],
    },
    {
      id: "kyc",
      label: "KYC & Compliance",
      pages: [
        { id: "kyc_review", label: "KYC Review", level: "full" },
        { id: "kyc_entities", label: "Entity Management", level: "full" },
      ],
    },
    {
      id: "eventday",
      label: "Event Day Hub",
      pages: [
        { id: "eventday_scanner", label: "QR Scanner", level: "full" },
        { id: "eventday_print", label: "Print Center", level: "full" },
        { id: "eventday_walkin", label: "Walk-In Registration", level: "full" },
        { id: "eventday_history", label: "Scan History", level: "full" },
      ],
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      pages: [
        { id: "subscriptions_plans", label: "Plans Management", level: "full" },
        { id: "subscriptions_tickets", label: "Advanced Tickets", level: "full" },
      ],
    },
  ],

  [UserRole.ADMIN]: [
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "dashboard_view", label: "Admin Dashboard", level: "full" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "events_all", label: "All Events", level: "full" },
        { id: "events_pending", label: "Pending Approval", level: "full" },
        { id: "events_featured", label: "Featured Events", level: "full" },
        { id: "events_moderation", label: "Moderation", level: "full" },
      ],
    },
    {
      id: "users",
      label: "Users",
      pages: [
        { id: "users_all", label: "All Users", level: "full" },
        { id: "users_staff", label: "Staff Management", level: "full" },
        { id: "users_roles", label: "User Roles", level: "full" },
        { id: "users_performance", label: "Staff Performance", level: "full" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      pages: [
        { id: "finance_dashboard", label: "Finance Dashboard", level: "full" },
        { id: "finance_payments", label: "Payments", level: "full" },
        { id: "finance_disbursements", label: "Disbursements", level: "full" },
        { id: "finance_refunds", label: "Refunds", level: "full" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      pages: [
        { id: "analytics_platform", label: "Platform Analytics", level: "full" },
        { id: "analytics_revenue", label: "Revenue Analytics", level: "full" },
      ],
    },
    {
      id: "support",
      label: "Support & Marketing",
      pages: [
        { id: "support_services", label: "Support Services", level: "full" },
        { id: "support_communications", label: "Communications", level: "full" },
        { id: "support_feedback", label: "Platform Feedback", level: "full" },
        { id: "support_flagged", label: "Flagged Events", level: "full" },
        { id: "marketing_social", label: "Social Media", level: "full" },
        { id: "marketing_whitelabel", label: "White Label", level: "full" },
      ],
    },
    {
      id: "kyc",
      label: "KYC & Compliance",
      pages: [
        { id: "kyc_review", label: "KYC Review", level: "full" },
        { id: "kyc_entities", label: "Entity Management", level: "full" },
      ],
    },
    {
      id: "eventday",
      label: "Event Day Hub",
      pages: [
        { id: "eventday_scanner", label: "QR Scanner", level: "full" },
        { id: "eventday_print", label: "Print Center", level: "full" },
        { id: "eventday_walkin", label: "Walk-In Registration", level: "full" },
        { id: "eventday_history", label: "Scan History", level: "full" },
      ],
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      pages: [
        { id: "subscriptions_plans", label: "Plans Management", level: "full" },
        { id: "subscriptions_tickets", label: "Advanced Tickets", level: "full" },
      ],
    },
  ],

  [UserRole.SUPPORT]: [
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "dashboard_view", label: "Admin Dashboard", level: "read" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "events_all", label: "All Events", level: "read" },
        { id: "events_pending", label: "Pending Approval", level: "none" },
        { id: "events_featured", label: "Featured Events", level: "none" },
        { id: "events_moderation", label: "Moderation", level: "none" },
      ],
    },
    {
      id: "users",
      label: "Users",
      pages: [
        { id: "users_all", label: "All Users", level: "read" },
        { id: "users_staff", label: "Staff Management", level: "none" },
        { id: "users_roles", label: "User Roles", level: "none" },
        { id: "users_performance", label: "Staff Performance", level: "none" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      pages: [
        { id: "finance_dashboard", label: "Finance Dashboard", level: "none" },
        { id: "finance_payments", label: "Payments", level: "none" },
        { id: "finance_disbursements", label: "Disbursements", level: "none" },
        { id: "finance_refunds", label: "Refunds", level: "none" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      pages: [
        { id: "analytics_platform", label: "Platform Analytics", level: "none" },
        { id: "analytics_revenue", label: "Revenue Analytics", level: "none" },
      ],
    },
    {
      id: "support",
      label: "Support & Marketing",
      pages: [
        { id: "support_services", label: "Support Services", level: "full" },
        { id: "support_communications", label: "Communications", level: "full" },
        { id: "support_feedback", label: "Platform Feedback", level: "full" },
        { id: "support_flagged", label: "Flagged Events", level: "full" },
        { id: "marketing_social", label: "Social Media", level: "full" },
        { id: "marketing_whitelabel", label: "White Label", level: "full" },
      ],
    },
    {
      id: "kyc",
      label: "KYC & Compliance",
      pages: [
        { id: "kyc_review", label: "KYC Review", level: "none" },
        { id: "kyc_entities", label: "Entity Management", level: "none" },
      ],
    },
    {
      id: "eventday",
      label: "Event Day Hub",
      pages: [
        { id: "eventday_scanner", label: "QR Scanner", level: "none" },
        { id: "eventday_print", label: "Print Center", level: "none" },
        { id: "eventday_walkin", label: "Walk-In Registration", level: "none" },
        { id: "eventday_history", label: "Scan History", level: "none" },
      ],
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      pages: [
        { id: "subscriptions_plans", label: "Plans Management", level: "none" },
        { id: "subscriptions_tickets", label: "Advanced Tickets", level: "none" },
      ],
    },
  ],

  [UserRole.TELLER]: [
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "dashboard_view", label: "Admin Dashboard", level: "read" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "events_all", label: "All Events", level: "none" },
        { id: "events_pending", label: "Pending Approval", level: "none" },
        { id: "events_featured", label: "Featured Events", level: "none" },
        { id: "events_moderation", label: "Moderation", level: "none" },
      ],
    },
    {
      id: "users",
      label: "Users",
      pages: [
        { id: "users_all", label: "All Users", level: "none" },
        { id: "users_staff", label: "Staff Management", level: "none" },
        { id: "users_roles", label: "User Roles", level: "none" },
        { id: "users_performance", label: "Staff Performance", level: "none" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      pages: [
        { id: "finance_dashboard", label: "Finance Dashboard", level: "none" },
        { id: "finance_payments", label: "Payments", level: "none" },
        { id: "finance_disbursements", label: "Disbursements", level: "none" },
        { id: "finance_refunds", label: "Refunds", level: "none" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      pages: [
        { id: "analytics_platform", label: "Platform Analytics", level: "none" },
        { id: "analytics_revenue", label: "Revenue Analytics", level: "none" },
      ],
    },
    {
      id: "support",
      label: "Support & Marketing",
      pages: [
        { id: "support_services", label: "Support Services", level: "none" },
        { id: "support_communications", label: "Communications", level: "none" },
        { id: "support_feedback", label: "Platform Feedback", level: "none" },
        { id: "support_flagged", label: "Flagged Events", level: "none" },
        { id: "marketing_social", label: "Social Media", level: "none" },
        { id: "marketing_whitelabel", label: "White Label", level: "none" },
      ],
    },
    {
      id: "kyc",
      label: "KYC & Compliance",
      pages: [
        { id: "kyc_review", label: "KYC Review", level: "none" },
        { id: "kyc_entities", label: "Entity Management", level: "none" },
      ],
    },
    {
      id: "eventday",
      label: "Event Day Hub",
      pages: [
        { id: "eventday_scanner", label: "QR Scanner", level: "full" },
        { id: "eventday_print", label: "Print Center", level: "full" },
        { id: "eventday_walkin", label: "Walk-In Registration", level: "full" },
        { id: "eventday_history", label: "Scan History", level: "full" },
      ],
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      pages: [
        { id: "subscriptions_plans", label: "Plans Management", level: "none" },
        { id: "subscriptions_tickets", label: "Advanced Tickets", level: "none" },
      ],
    },
  ],

  [UserRole.ORGANIZER]: [
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "org_dashboard", label: "Organizer Dashboard", level: "full" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "org_events_all", label: "All Events", level: "full" },
        { id: "org_events_create", label: "Create Events", level: "full" },
        { id: "org_events_manage", label: "Event Management", level: "full" },
        { id: "org_events_templates", label: "Event Templates", level: "full" },
      ],
    },
    {
      id: "attendees",
      label: "Attendees",
      pages: [
        { id: "org_attendees_list", label: "Attendee List", level: "full" },
        { id: "org_attendees_comms", label: "Communications", level: "full" },
        { id: "org_attendees_segments", label: "Segmentation", level: "full" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      pages: [
        { id: "org_analytics_performance", label: "Event Performance", level: "full" },
        { id: "org_analytics_attendees", label: "Attendee Insights", level: "full" },
        { id: "org_analytics_revenue", label: "Revenue Analytics", level: "full" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      pages: [
        { id: "org_finance_overview", label: "Financial Overview", level: "full" },
        { id: "org_finance_payouts", label: "Payouts", level: "full" },
      ],
    },
    {
      id: "team",
      label: "Team & Settings",
      pages: [
        { id: "org_staff", label: "Staff Management", level: "full" },
        { id: "org_subscription", label: "Subscription", level: "full" },
        { id: "org_branding", label: "Branding", level: "full" },
        { id: "org_settings", label: "Settings", level: "full" },
      ],
    },
    {
      id: "eventday",
      label: "Event Day Hub",
      pages: [
        { id: "org_eventday_scanner", label: "QR Scanner", level: "full" },
        { id: "org_eventday_history", label: "Scan History", level: "full" },
      ],
    },
  ],

  [UserRole.ORGANIZER_ADMIN]: [
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "org_dashboard", label: "Organizer Dashboard", level: "full" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "org_events_all", label: "All Events", level: "full" },
        { id: "org_events_create", label: "Create Events", level: "none" },
        { id: "org_events_manage", label: "Event Management", level: "full" },
        { id: "org_events_templates", label: "Event Templates", level: "read" },
      ],
    },
    {
      id: "attendees",
      label: "Attendees",
      pages: [
        { id: "org_attendees_list", label: "Attendee List", level: "full" },
        { id: "org_attendees_comms", label: "Communications", level: "full" },
        { id: "org_attendees_segments", label: "Segmentation", level: "read" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      pages: [
        { id: "org_analytics_performance", label: "Event Performance", level: "full" },
        { id: "org_analytics_attendees", label: "Attendee Insights", level: "full" },
        { id: "org_analytics_revenue", label: "Revenue Analytics", level: "none" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      pages: [
        { id: "org_finance_overview", label: "Financial Overview", level: "none" },
        { id: "org_finance_payouts", label: "Payouts", level: "none" },
      ],
    },
    {
      id: "team",
      label: "Team & Settings",
      pages: [
        { id: "org_staff", label: "Staff Management", level: "none" },
        { id: "org_subscription", label: "Subscription", level: "none" },
        { id: "org_branding", label: "Branding", level: "none" },
        { id: "org_settings", label: "Settings", level: "none" },
      ],
    },
    {
      id: "eventday",
      label: "Event Day Hub",
      pages: [
        { id: "org_eventday_scanner", label: "QR Scanner", level: "full" },
        { id: "org_eventday_history", label: "Scan History", level: "full" },
      ],
    },
  ],

  [UserRole.ORGANIZER_TELLER]: [
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "org_dashboard", label: "Organizer Dashboard", level: "read" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "org_events_all", label: "All Events", level: "none" },
        { id: "org_events_create", label: "Create Events", level: "none" },
        { id: "org_events_manage", label: "Event Management", level: "none" },
        { id: "org_events_templates", label: "Event Templates", level: "none" },
      ],
    },
    {
      id: "attendees",
      label: "Attendees",
      pages: [
        { id: "org_attendees_list", label: "Attendee List", level: "none" },
        { id: "org_attendees_comms", label: "Communications", level: "none" },
        { id: "org_attendees_segments", label: "Segmentation", level: "none" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      pages: [
        { id: "org_analytics_performance", label: "Event Performance", level: "none" },
        { id: "org_analytics_attendees", label: "Attendee Insights", level: "none" },
        { id: "org_analytics_revenue", label: "Revenue Analytics", level: "none" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      pages: [
        { id: "org_finance_overview", label: "Financial Overview", level: "none" },
        { id: "org_finance_payouts", label: "Payouts", level: "none" },
      ],
    },
    {
      id: "team",
      label: "Team & Settings",
      pages: [
        { id: "org_staff", label: "Staff Management", level: "none" },
        { id: "org_subscription", label: "Subscription", level: "none" },
        { id: "org_branding", label: "Branding", level: "none" },
        { id: "org_settings", label: "Settings", level: "none" },
      ],
    },
    {
      id: "eventday",
      label: "Event Day Hub",
      pages: [
        { id: "org_eventday_scanner", label: "QR Scanner", level: "full" },
        { id: "org_eventday_history", label: "Scan History", level: "full" },
      ],
    },
  ],

  [UserRole.ATTENDEE]: [
    {
      id: "dashboard",
      label: "Dashboard",
      pages: [{ id: "user_dashboard", label: "User Dashboard", level: "full" }],
    },
    {
      id: "events",
      label: "Events",
      pages: [
        { id: "user_browse", label: "Browse Events", level: "full" },
        { id: "user_register", label: "Register for Events", level: "full" },
      ],
    },
    {
      id: "tickets",
      label: "Tickets",
      pages: [
        { id: "user_tickets", label: "My Tickets", level: "full" },
        { id: "user_transfers", label: "Ticket Transfers", level: "full" },
      ],
    },
    {
      id: "account",
      label: "Account",
      pages: [
        { id: "user_profile", label: "Profile", level: "full" },
        { id: "user_preferences", label: "Preferences", level: "full" },
      ],
    },
  ],
};

// ─── Role Card Metadata ──────────────────────────────────────────────────────

interface RoleCardMeta {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badgeColor: string;
  domain: "platform" | "organizer" | "user";
}

const ROLE_CARD_META: Record<UserRole, RoleCardMeta> = {
  [UserRole.SUPERADMIN]: {
    icon: Crown,
    gradient: "from-rose-500 to-pink-600",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    domain: "platform",
  },
  [UserRole.ADMIN]: {
    icon: Shield,
    gradient: "from-violet-500 to-purple-600",
    badgeColor: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    domain: "platform",
  },
  [UserRole.SUPPORT]: {
    icon: HeadphonesIcon,
    gradient: "from-emerald-500 to-teal-600",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    domain: "platform",
  },
  [UserRole.TELLER]: {
    icon: Monitor,
    gradient: "from-blue-500 to-indigo-600",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    domain: "platform",
  },
  [UserRole.ORGANIZER]: {
    icon: Users,
    gradient: "from-amber-500 to-orange-600",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    domain: "organizer",
  },
  [UserRole.ORGANIZER_ADMIN]: {
    icon: UserCheck,
    gradient: "from-teal-500 to-cyan-600",
    badgeColor: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    domain: "organizer",
  },
  [UserRole.ORGANIZER_TELLER]: {
    icon: Monitor,
    gradient: "from-cyan-500 to-sky-600",
    badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    domain: "organizer",
  },
  [UserRole.ATTENDEE]: {
    icon: Ticket,
    gradient: "from-slate-500 to-gray-600",
    badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    domain: "user",
  },
};

const DOMAIN_LABELS: Record<string, string> = {
  platform: "Platform Roles",
  organizer: "Organizer Roles",
  user: "User Roles",
};

const DOMAIN_ORDER = ["platform", "organizer", "user"] as const;

// ─── Access Level Badge ──────────────────────────────────────────────────────

function AccessBadge({ level }: { level: "full" | "read" | "none" }) {
  if (level === "full") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <Check className="h-3 w-3" /> Full
      </span>
    );
  }
  if (level === "read") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <Eye className="h-3 w-3" /> View
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <X className="h-3 w-3" /> None
    </span>
  );
}

// ─── Permission Summary (for card) ──────────────────────────────────────────

function PermissionSummary({ categories }: { categories: PermissionCategory[] }) {
  const counts = useMemo(() => {
    let full = 0;
    let read = 0;
    let none = 0;
    for (const cat of categories) {
      for (const page of cat.pages) {
        if (page.level === "full") full++;
        else if (page.level === "read") read++;
        else none++;
      }
    }
    return { full, read, none, total: full + read + none };
  }, [categories]);

  return (
    <div className="flex items-center gap-3 text-xs">
      {counts.full > 0 && (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" /> {counts.full} full
        </span>
      )}
      {counts.read > 0 && (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Eye className="h-3 w-3" /> {counts.read} view
        </span>
      )}
      {counts.none > 0 && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <X className="h-3 w-3" /> {counts.none} none
        </span>
      )}
    </div>
  );
}

// ─── Access Level Cycle (for editing in modal) ──────────────────────────────

function AccessLevelToggle({
  level,
  onChange,
  disabled,
}: {
  level: "full" | "read" | "none";
  onChange: (level: "full" | "read" | "none") => void;
  disabled?: boolean;
}) {
  const cycle = () => {
    if (disabled) return;
    const next = level === "none" ? "read" : level === "read" ? "full" : "none";
    onChange(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={disabled}
      className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={`Click to cycle: ${level} → ${level === "none" ? "read" : level === "read" ? "full" : "none"}`}
    >
      <AccessBadge level={level} />
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const UserRolesPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleInfo[]>([]);

  // Modal state
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [editPermissions, setEditPermissions] = useState<PermissionCategory[] | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { canModifyUser } = usePermissions();

  // Fetch roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await getRoles();
        if (response.success && response.data) {
          setRoles(response.data.roles);
        }
      } catch (err: unknown) {
        showErrorToast(toast, err, "Load failed", "Failed to load roles");
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [toast]);

  // Group roles by domain
  const groupedRoles = useMemo(() => {
    const groups: Record<string, UserRole[]> = { platform: [], organizer: [], user: [] };
    const allRoleEnums = Object.values(UserRole);
    for (const role of allRoleEnums) {
      const meta = ROLE_CARD_META[role];
      if (meta) {
        groups[meta.domain].push(role);
      }
    }
    return groups;
  }, []);

  // Filter by search
  const matchesSearch = (role: UserRole) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const label = (ROLE_LABELS[role] || role).toLowerCase();
    const desc = (ROLE_DESCRIPTIONS[role] || "").toLowerCase();
    return label.includes(term) || desc.includes(term) || role.toLowerCase().includes(term);
  };

  // Find backend RoleInfo for a given role enum
  const getRoleInfo = (role: UserRole): RoleInfo | undefined =>
    roles.find((r) => r.role === role);

  // Open modal
  const openRoleModal = (role: UserRole) => {
    setSelectedRole(role);
    // Deep clone the default permissions for editing
    const defaults = DEFAULT_ROLE_PERMISSIONS[role];
    if (defaults) {
      setEditPermissions(JSON.parse(JSON.stringify(defaults)));
    }
    setHasChanges(false);
  };

  const closeModal = () => {
    setSelectedRole(null);
    setEditPermissions(null);
    setHasChanges(false);
  };

  // Update a single page permission
  const updatePageLevel = (catId: string, pageId: string, level: "full" | "read" | "none") => {
    if (!editPermissions) return;
    setEditPermissions((prev) =>
      prev!.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              pages: cat.pages.map((p) => (p.id === pageId ? { ...p, level } : p)),
            }
          : cat,
      ),
    );
    setHasChanges(true);
  };

  // Toggle entire category
  const toggleCategory = (catId: string, enabled: boolean) => {
    if (!editPermissions) return;
    setEditPermissions((prev) =>
      prev!.map((cat) =>
        cat.id === catId
          ? { ...cat, pages: cat.pages.map((p) => ({ ...p, level: enabled ? "full" : "none" })) }
          : cat,
      ),
    );
    setHasChanges(true);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (!selectedRole) return;
    const defaults = DEFAULT_ROLE_PERMISSIONS[selectedRole];
    if (defaults) {
      setEditPermissions(JSON.parse(JSON.stringify(defaults)));
      setHasChanges(false);
    }
  };

  // Save (for now, shows toast — backend persistence TBD)
  const savePermissions = () => {
    toast({
      title: "Permissions Updated",
      description: `Permissions for ${ROLE_LABELS[selectedRole!] || selectedRole} have been saved locally. Backend persistence coming soon.`,
    });
    setHasChanges(false);
  };

  const selectedMeta = selectedRole ? ROLE_CARD_META[selectedRole] : null;
  const selectedInfo = selectedRole ? getRoleInfo(selectedRole) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">User Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">
          View and manage role-based access control for all user types
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading roles...</div>
        </div>
      )}

      {/* Role Groups */}
      {!loading &&
        DOMAIN_ORDER.map((domain) => {
          const rolesInDomain = groupedRoles[domain]?.filter(matchesSearch) || [];
          if (rolesInDomain.length === 0) return null;

          return (
            <section key={domain} className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {DOMAIN_LABELS[domain]}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {rolesInDomain.map((role) => {
                  const meta = ROLE_CARD_META[role];
                  const info = getRoleInfo(role);
                  const permissions = DEFAULT_ROLE_PERMISSIONS[role];
                  const canEdit = canModifyUser(role);
                  const creatableRoles = roleCreationRules[role] || [];

                  // Count access levels
                  let fullCount = 0;
                  let readCount = 0;
                  if (permissions) {
                    for (const cat of permissions) {
                      for (const p of cat.pages) {
                        if (p.level === "full") fullCount++;
                        else if (p.level === "read") readCount++;
                      }
                    }
                  }

                  return (
                    <Card
                      key={role}
                      className="group relative overflow-hidden border-border/40 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => openRoleModal(role)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r ${meta.gradient} shadow-sm`}
                            >
                              <meta.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold">
                                {ROLE_LABELS[role] || info?.displayName || role}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={`mt-1 text-[10px] font-medium ${meta.badgeColor}`}
                              >
                                Level {roleHierarchy[role]}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {ROLE_DESCRIPTIONS[role] || info?.description}
                        </p>

                        {/* Access summary */}
                        {permissions && <PermissionSummary categories={permissions} />}

                        {/* Creatable roles */}
                        {creatableRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-muted-foreground mr-1">
                              Can create:
                            </span>
                            {creatableRoles.slice(0, 3).map((r) => (
                              <Badge
                                key={r}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}
                              </Badge>
                            ))}
                            {creatableRoles.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{creatableRoles.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground">
                            {fullCount + readCount} page{fullCount + readCount !== 1 ? "s" : ""}{" "}
                            accessible
                          </span>
                          {canEdit ? (
                            <span className="text-[10px] text-primary font-medium">
                              Click to edit
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">View only</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}

      {/* Empty search */}
      {!loading &&
        DOMAIN_ORDER.every(
          (d) => (groupedRoles[d]?.filter(matchesSearch) || []).length === 0,
        ) && (
          <div className="text-center py-12 text-muted-foreground">
            No roles found matching &quot;{searchTerm}&quot;
          </div>
        )}

      {/* ─── Detail / Edit Modal ────────────────────────────────────────── */}
      <Dialog
        open={!!selectedRole}
        onOpenChange={(open) => !open && closeModal()}
        hasUnsavedChanges={hasChanges}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedRole && selectedMeta && editPermissions && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r ${selectedMeta.gradient} shadow-sm`}
                  >
                    <selectedMeta.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle>
                      {ROLE_LABELS[selectedRole] || selectedRole}
                    </DialogTitle>
                    <DialogDescription>
                      {ROLE_DESCRIPTIONS[selectedRole] || selectedInfo?.description}
                      {" "}&middot; Hierarchy level {roleHierarchy[selectedRole]}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable permissions list */}
              <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4 py-2">
                {editPermissions.map((category) => {
                  const allFull = category.pages.every((p) => p.level === "full");
                  const allNone = category.pages.every((p) => p.level === "none");
                  const canEdit = canModifyUser(selectedRole);

                  return (
                    <div
                      key={category.id}
                      className="rounded-lg border border-border/40 bg-card overflow-hidden"
                    >
                      {/* Category header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
                        <span className="text-sm font-medium">{category.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {allFull ? "All enabled" : allNone ? "All disabled" : "Mixed"}
                          </span>
                          <Switch
                            checked={!allNone}
                            onCheckedChange={(checked) =>
                              toggleCategory(category.id, checked)
                            }
                            disabled={!canEdit}
                          />
                        </div>
                      </div>

                      {/* Pages */}
                      <div className="divide-y divide-border/30">
                        {category.pages.map((page) => (
                          <div
                            key={page.id}
                            className="flex items-center justify-between px-4 py-2"
                          >
                            <span className="text-sm text-foreground">{page.label}</span>
                            <AccessLevelToggle
                              level={page.level}
                              onChange={(level) =>
                                updatePageLevel(category.id, page.id, level)
                              }
                              disabled={!canEdit}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Role relationships */}
                {selectedRole && (
                  <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
                    <h4 className="text-sm font-medium">Role Relationships</h4>

                    {roleCreationRules[selectedRole]?.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Can create:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {roleCreationRules[selectedRole].map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs">
                              {ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedInfo?.modifiableRoles && selectedInfo.modifiableRoles.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Can modify:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedInfo.modifiableRoles.map((r) => (
                            <Badge key={r} variant="outline" className="text-xs">
                              {ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!roleCreationRules[selectedRole] ||
                      roleCreationRules[selectedRole].length === 0) &&
                      (!selectedInfo?.modifiableRoles ||
                        selectedInfo.modifiableRoles.length === 0) && (
                        <p className="text-xs text-muted-foreground">
                          This role cannot create or modify other roles.
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <DialogFooter className="border-t border-border/40 pt-4">
                <div className="flex w-full items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetToDefaults}
                    disabled={!hasChanges}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={closeModal}>
                      {hasChanges ? "Cancel" : "Close"}
                    </Button>
                    {canModifyUser(selectedRole) && (
                      <Button size="sm" onClick={savePermissions} disabled={!hasChanges}>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Save Changes
                      </Button>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRolesPage;
