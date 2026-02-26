import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getUserById,
  suspendUser,
  activateUser,
  getOrganizerProfile,
  getEmergencyContact,
  type User as ApiUser,
  type OrganizerProfile,
  type EmergencyContact,
} from "@/lib/admin-api";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";
import { RichTextContent } from "@/components/ui/RichTextContent";

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  twitter: "X (Twitter)",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
};

const OrganizerDetailsPage = () => {
  const { organizerId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [userData, setUserData] = useState<ApiUser | null>(null);
  const [organizerProfileData, setOrganizerProfileData] = useState<OrganizerProfile | null>(null);
  const [emergencyContactData, setEmergencyContactData] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizerId) {
        setError("Organizer ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getUserById(organizerId);
        if (response.success && response.data?.user) {
          setUserData(response.data.user);

          try {
            const profileResponse = await getOrganizerProfile(organizerId);
            if (profileResponse.success && profileResponse.data?.organizerProfile) {
              setOrganizerProfileData(profileResponse.data.organizerProfile);
            }
          } catch {
            // No organizer profile yet — fine
          }

          try {
            const contactResponse = await getEmergencyContact(organizerId);
            if (contactResponse.success && contactResponse.data?.emergencyContact) {
              setEmergencyContactData(contactResponse.data.emergencyContact);
            }
          } catch {
            // No emergency contact — fine
          }
        } else {
          setError("Organizer not found");
        }
      } catch {
        setError("Failed to load organizer details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizerId]);

  const handleVerify = async () => {
    if (!organizerId) return;
    try {
      setActionLoading(true);
      const response = await activateUser(organizerId);
      if (response.success) {
        setUserData(prev => prev ? { ...prev, status: "ACTIVE" as const } : null);
      }
    } catch {
      // handle silently
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!organizerId) return;
    try {
      setActionLoading(true);
      const response = await suspendUser(organizerId);
      if (response.success) {
        setUserData(prev => prev ? { ...prev, status: "SUSPENDED" as const } : null);
      }
    } catch {
      // handle silently
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: "APPROVED",
      SUSPENDED: "SUSPENDED",
      PENDING_APPROVAL: "PENDING",
      DEACTIVATED: "DECLINED",
    };
    return getEventStatusBadgeClass(statusMap[status] || status);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const socialLinks = organizerProfileData
    ? (organizerProfileData as unknown as { socialLinks?: Record<string, string> }).socialLinks
    : null;

  const filledSocialLinks = socialLinks
    ? Object.entries(socialLinks).filter(([, v]) => v?.trim())
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
        <span className="ml-2 text-muted-foreground">Loading organizer details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BackButton to="/admin/users/organizers" label="Back to Organizers" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userData) return null;

  const status = userData.status;
  const totalRevenue = organizerProfileData?.totalRevenue ? Number(organizerProfileData.totalRevenue) : 0;
  const rating = organizerProfileData?.rating ? Number(organizerProfileData.rating) : null;
  const totalEvents = organizerProfileData?.totalEvents || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/admin/users/organizers" label="Back to Organizers" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {userData.firstName} {userData.lastName}
            </h1>
            {userData.organizationName && (
              <p className="text-sm text-muted-foreground">{userData.organizationName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === "PENDING_APPROVAL" && (
            <Button size="sm" onClick={handleVerify} disabled={actionLoading}>
              {actionLoading ? <Loader className="inline mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          )}
          {status === "ACTIVE" && (
            <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={actionLoading}>
              {actionLoading ? <Loader className="inline mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Suspend
            </Button>
          )}
          {status === "SUSPENDED" && (
            <Button size="sm" onClick={handleVerify} disabled={actionLoading}>
              {actionLoading ? <Loader className="inline mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <Badge className={`text-xs ${getStatusBadge(status)}`}>
              {status === "PENDING_APPROVAL" ? "Pending" : status === "ACTIVE" ? "Active" : status.charAt(0) + status.slice(1).toLowerCase()}
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">Events</span>
            </div>
            <p className="text-lg font-bold text-primary">{totalEvents}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">Rating</span>
            </div>
            <p className="text-lg font-bold text-primary">{rating ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Section 1: Personal Identity */}
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Personal Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border/40">
                  <InfoRow icon={User} label="Full Name" value={`${userData.firstName} ${userData.lastName}`} />
                  <InfoRow icon={Mail} label="Login Email" value={userData.email} />
                  {userData.phoneNumber && (
                    <InfoRow icon={Phone} label="Phone" value={userData.phoneNumber} />
                  )}
                  {userData.companyAffiliation && (
                    <InfoRow icon={Briefcase} label="Company Affiliation" value={userData.companyAffiliation} />
                  )}
                </CardContent>
              </Card>

              {/* Section 2: Organizer Identity */}
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Organizer Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border/40">
                  <InfoRow
                    icon={Building2}
                    label="Organizer / Brand Name"
                    value={userData.organizationName || "—"}
                  />
                  {userData.businessEmail && (
                    <InfoRow icon={Mail} label="Business Email" value={userData.businessEmail} />
                  )}
                  {organizerProfileData?.location && (
                    <InfoRow icon={MapPin} label="Location" value={organizerProfileData.location} />
                  )}
                  <InfoRow icon={Calendar} label="Joined" value={formatDate(userData.createdAt)} />
                </CardContent>
              </Card>

              {/* Section 3: Public Profile */}
              {(organizerProfileData?.description || organizerProfileData?.website || filledSocialLinks.length > 0) && (
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Public Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {organizerProfileData?.description && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">About</p>
                        <RichTextContent
                          content={organizerProfileData.description}
                          className="text-sm text-foreground leading-relaxed"
                        />
                      </div>
                    )}
                    {organizerProfileData?.website && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Website</p>
                        <a
                          href={organizerProfileData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {organizerProfileData.website}
                        </a>
                      </div>
                    )}
                    {filledSocialLinks.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Social Media</p>
                        <div className="space-y-1">
                          {filledSocialLinks.map(([key, url]) => (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-24 shrink-0">
                                {SOCIAL_PLATFORM_LABELS[key] || key}
                              </span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline truncate"
                              >
                                {url}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Section 4: Business / KYC */}
              {(organizerProfileData?.businessLicense || organizerProfileData?.taxId || organizerProfileData?.bankAccountLast4) && (
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Business / KYC Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0 divide-y divide-border/40">
                    {organizerProfileData?.businessLicense && (
                      <InfoRow icon={FileText} label="Business License" value={organizerProfileData.businessLicense} />
                    )}
                    {organizerProfileData?.taxId && (
                      <InfoRow icon={FileText} label="Tax ID" value={organizerProfileData.taxId} />
                    )}
                    {organizerProfileData?.bankAccountLast4 && (
                      <InfoRow icon={FileText} label="Bank Account" value={`****${organizerProfileData.bankAccountLast4}`} />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contact */}
              {emergencyContactData && (
                <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0 divide-y divide-border/40">
                    <InfoRow icon={User} label="Name" value={emergencyContactData.name} />
                    <InfoRow icon={Phone} label="Phone" value={emergencyContactData.phone} />
                    <InfoRow icon={User} label="Relationship" value={emergencyContactData.relationship} />
                    {emergencyContactData.email && (
                      <InfoRow icon={Mail} label="Email" value={emergencyContactData.email} />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right sidebar: Statistics */}
            <div className="space-y-6">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Account Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatRow label="Total Events" value={totalEvents.toString()} />
                  <StatRow label="Total Revenue" value={formatCurrency(totalRevenue)} />
                  {rating !== null && (
                    <StatRow
                      label="Average Rating"
                      value={
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-warning fill-current" />
                          <span>{rating}</span>
                        </div>
                      }
                    />
                  )}
                  <StatRow label="Email Verified" value={userData.isEmailVerified ? "Yes" : "No"} />
                  <StatRow
                    label="Last Updated"
                    value={formatDate(userData.updatedAt)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Organizer Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm">Event history will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm">No support tickets found.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-3 gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm text-foreground text-right">{value}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default OrganizerDetailsPage;
