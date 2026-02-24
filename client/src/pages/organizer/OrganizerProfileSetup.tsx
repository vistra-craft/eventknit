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
import { getMyOrganizerProfile, updateMyOrganizerProfile } from '@/lib/organizer-profile-api';
import * as authApi from '@/lib/auth-api';
import {
  CheckCircle,
  Shield,
  ArrowRight,
  Globe,
  ChevronDown,
  ChevronUp,
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

  // Form state
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);

  // Loading/saving state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Pre-fill from user auth context
        if (user) {
          setOrganizationName(user.organizationName || '');
          setPhone(user.phoneNumber || '');
          setAvatar(user.avatar || null);
        }

        // Fetch extended profile
        const response = await getMyOrganizerProfile();
        if (response.success && response.data?.organizerProfile) {
          const profile = response.data.organizerProfile;
          setDescription(profile.description || '');
          setWebsite(profile.website || '');
          setSocialLinks((profile.socialLinks as Record<string, string>) || {});
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

  const handleAvatarChange = async (file: File | null) => {
    if (file) {
      setAvatarFile(file);
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (navigateTo: 'dashboard' | 'kyc') => {
    setIsSaving(true);

    try {
      // 1. Update User fields (organizationName, phone, avatar)
      if (avatarFile) {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        formData.append('organizationName', organizationName);
        formData.append('phoneNumber', phone);
        await authApi.updateProfile(formData);
        setIsUploadingAvatar(false);
        setAvatarFile(null);
      } else {
        await authApi.updateProfile({
          organizationName: organizationName || undefined,
          phoneNumber: phone || undefined,
        });
      }

      // 2. Update OrganizerProfile (description, website, socialLinks)
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([, v]) => v && v.trim())
      );
      await updateMyOrganizerProfile({
        description: description || undefined,
        website: website || undefined,
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
      toast({
        title: 'Error',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsUploadingAvatar(false);
    }
  };

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

      {/* Form */}
      <div className="space-y-6">
        {/* Avatar */}
        <div className="rounded-2xl border border-border/40 bg-card p-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Profile Picture</h3>
          <AvatarUpload
            currentAvatar={avatar}
            onAvatarChange={handleAvatarChange}
            isUploading={isUploadingAvatar || uploadAvatarMutation.isPending}
            userName={organizationName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
          />
        </div>

        {/* Organization Details */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Organization Details</h3>

          <div>
            <Label htmlFor="orgName">Organization Name *</Label>
            <Input
              id="orgName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Your organization or brand name"
              className="mt-1"
            />
          </div>

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
        </div>

        {/* Website & Social Links */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Online Presence</h3>

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

          {/* Social links toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowSocialLinks(!showSocialLinks)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSocialLinks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Social Media Links
              {Object.values(socialLinks).filter(v => v?.trim()).length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {Object.values(socialLinks).filter(v => v?.trim()).length} added
                </span>
              )}
            </button>

            {showSocialLinks && (
              <div className="space-y-3 mt-3">
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
            )}
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
