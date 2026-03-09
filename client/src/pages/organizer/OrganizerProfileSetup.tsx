import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';
import { getMyOrganizerProfile, updateMyOrganizerProfile } from '@/lib/organizer-profile-api';
import * as authApi from '@/lib/auth-api';
import {
  CheckCircle,
  Shield,
  ArrowRight,
  Globe,
  Loader2,
} from 'lucide-react';

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
];

// Helper function to strip HTML tags and get text length
const getTextLength = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length;
};

export default function OrganizerProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const uploadAvatarMutation = useUploadAvatar();
  const { toast } = useToast();

  const state = location.state as {
    message?: string;
    eventCreated?: boolean;
    fromEventCreation?: boolean;
  } | null;

  // Personal fields
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [phone, setPhone] = useState('');
  const [companyAffiliation, setCompanyAffiliation] = useState('');

  // Organizer identity fields
  const [organizationName, setOrganizationName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [location2, setLocation2] = useState('');

  // Public profile fields
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  // Loading/saving state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (user) {
          setOrganizationName(user.organizationName || '');
          setPhone(user.phoneNumber || '');
          setAvatar(user.avatar || null);
          setCompanyAffiliation(user.companyAffiliation || '');
          setBusinessEmail(user.businessEmail || '');
        }

        const response = await getMyOrganizerProfile();
        if (response.success && response.data?.organizerProfile) {
          const profile = response.data.organizerProfile;
          setDescription(profile.description || '');
          setWebsite(profile.website || '');
          setSocialLinks((profile.socialLinks as Record<string, string>) || {});
          setLocation2(profile.location || '');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  // Clear navigation state
  useEffect(() => {
    if (state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  const handleAvatarChange = (file: File, preview: string) => {
    if (file.size > 0) {
      setAvatarFile(file);
      setAvatar(preview);
    } else {
      // Remove triggered
      setAvatarFile(null);
      setAvatar(null);
    }
  };

  const handleSave = async (navigateTo: 'dashboard' | 'kyc') => {
    setIsSaving(true);

    try {
      // 1. Update User fields
      if (avatarFile) {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        formData.append('organizationName', organizationName);
        formData.append('phoneNumber', phone);
        if (companyAffiliation) formData.append('companyAffiliation', companyAffiliation);
        if (businessEmail) formData.append('businessEmail', businessEmail);
        await authApi.updateProfile(formData);
        setIsUploadingAvatar(false);
        setAvatarFile(null);
      } else {
        await authApi.updateProfile({
          organizationName: organizationName || undefined,
          phoneNumber: phone || undefined,
          companyAffiliation: companyAffiliation || undefined,
          businessEmail: businessEmail || undefined,
        });
      }

      // 2. Update OrganizerProfile
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([, v]) => v && v.trim())
      );
      await updateMyOrganizerProfile({
        description: description || undefined,
        website: website || undefined,
        location: location2 || undefined,
        socialLinks: Object.keys(filteredSocialLinks).length > 0 ? filteredSocialLinks : undefined,
        markComplete: true,
      });

      // 3. Refresh auth context
      await refreshProfile();

      toast({
        title: 'Profile completed',
        description: 'Your organizer profile has been saved successfully.',
      });

      if (navigateTo === 'kyc') {
        navigate('/organizer/kyc', {
          state: { fromProfileSetup: true },
        });
      } else {
        navigate('/organizer/dashboard', {
          state: { message: 'Profile completed successfully!' },
        });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      showErrorToast(toast, error, 'Failed to save profile');
    } finally {
      setIsSaving(false);
      setIsUploadingAvatar(false);
    }
  };

  const entityType = user?.organizerEntityType;
  const isIndividual = !entityType || entityType === 'INDIVIDUAL';
  const formatEntityType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Success banner from event creation */}
      {state?.message && (
        <Alert className="mb-6 border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700 dark:text-emerald-400">
            {state.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Set Up Your Organizer Profile</h1>
        <p className="text-muted-foreground mt-1">
          This information helps attendees learn about you and builds trust. It will appear on all your event pages.
        </p>
      </div>

      <div className="space-y-6">

        {/* Section 1: Personal Identity */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Personal Identity</h3>

          <AvatarUpload
            currentAvatar={avatar}
            onAvatarChange={handleAvatarChange}
            isUploading={isUploadingAvatar || uploadAvatarMutation.isPending}
            userName={organizationName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
            isLogo={!isIndividual}
            label={isIndividual ? 'Profile Photo' : 'Company / Organization Logo'}
            hint={
              isIndividual
                ? 'Your photo will be displayed on your profile and in event communications.'
                : 'Your logo will appear on all your event pages and in attendee communications.'
            }
          />

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Not shown publicly. Used for admin contact only.
            </p>
          </div>

          {isIndividual && (
            <div>
              <Label htmlFor="companyAffiliation">Company Affiliation <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="companyAffiliation"
                value={companyAffiliation}
                onChange={(e) => setCompanyAffiliation(e.target.value)}
                placeholder="Your employer or institutional affiliation"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your day-job employer or affiliated institution, if different from your organizer name.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Organizer Identity */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Organizer Identity</h3>
            {entityType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {formatEntityType(entityType)}
              </span>
            )}
          </div>

          <div>
            <Label htmlFor="orgName">
              {isIndividual ? 'Organizer / Brand Name' : 'Legal / Registered Name'}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="orgName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={isIndividual ? 'Your name or brand name' : 'Your registered company or organization name'}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isIndividual
                ? 'This is how attendees will identify you on event pages.'
                : 'Your official registered name as it appears on legal documents.'}
            </p>
          </div>

          <div>
            <Label htmlFor="businessEmail">Business Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="businessEmail"
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              placeholder="contact@yourorganization.com"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Public-facing contact email for attendees. Defaults to your login email if left blank.
            </p>
          </div>

          <div>
            <Label htmlFor="location">Location <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="location"
              value={location2}
              onChange={(e) => setLocation2(e.target.value)}
              placeholder="Nairobi, Kenya"
              className="mt-1"
            />
          </div>
        </div>

        {/* Section 3: Public Profile */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Public Profile</h3>

          <div>
            <Label htmlFor="description">About Your Organization</Label>
            <div className="mt-1">
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="Tell attendees about your organization, what events you host, and what makes them special..."
                minHeight="120px"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getTextLength(description)}/2000 characters. This will appear on all your event pages.
            </p>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="pl-10"
              />
            </div>
          </div>

          {/* Social links — always visible */}
          <div>
            <Label className="mb-3 block">Social Media Links</Label>
            <div className="space-y-3">
              {SOCIAL_PLATFORMS.map(platform => (
                <div key={platform.key} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">{platform.label}</span>
                  <Input
                    value={socialLinks[platform.key] || ''}
                    onChange={(e) => setSocialLinks(prev => ({
                      ...prev,
                      [platform.key]: e.target.value,
                    }))}
                    placeholder={platform.placeholder}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => handleSave('dashboard')}
            disabled={isSaving || !organizationName.trim()}
            className="w-full h-12 text-base"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Complete Profile
          </Button>

          <Button
            variant="outline"
            onClick={() => handleSave('kyc')}
            disabled={isSaving || !organizationName.trim()}
            className="w-full h-12 text-base border-primary/30 text-primary hover:bg-primary/5"
          >
            <Shield className="mr-2 h-4 w-4" />
            Complete Profile & Start Verification
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <button
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            I&apos;ll do this later
          </button>
        </div>
      </div>
    </div>
  );
}
