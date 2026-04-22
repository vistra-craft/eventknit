import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import PhoneInput from '@/components/ui/PhoneInput';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';
import { getMyOrganizerProfile, updateMyOrganizerProfile } from '@/lib/organizer-profile-api';
import * as authApi from '@/lib/auth-api';
import { CheckCircle, Shield, ArrowRight, Globe, Loader2, Circle, AlertCircle } from 'lucide-react';

const isValidUrl = (url: string): boolean => {
  try { new URL(url); return true; } catch { return false; }
};

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const SOCIAL_PLATFORMS = [
  { key: 'facebook',  label: 'Facebook',    placeholder: 'https://facebook.com/yourpage' },
  { key: 'twitter',   label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'instagram', label: 'Instagram',   placeholder: 'https://instagram.com/yourhandle' },
  { key: 'linkedin',  label: 'LinkedIn',    placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'youtube',   label: 'YouTube',     placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok',    label: 'TikTok',      placeholder: 'https://tiktok.com/@yourhandle' },
];

const getTextLength = (html: string) => html.replace(/<[^>]*>/g, '').trim().length;

const formatEntityType = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function OrganizerProfileSetup() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, refreshProfile } = useAuth();
  const { toast }  = useToast();

  const state = location.state as { message?: string; eventCreated?: boolean; fromEventCreation?: boolean } | null;

  const [avatar,            setAvatar]            = useState<string | null>(null);
  const [phone,             setPhone]             = useState('');
  const [companyAffiliation,setCompanyAffiliation] = useState('');
  const [organizationName,  setOrganizationName]  = useState('');
  const [businessEmail,     setBusinessEmail]     = useState('');
  const [location2,         setLocation2]         = useState('');
  const [description,       setDescription]       = useState('');
  const [website,           setWebsite]           = useState('');
  const [socialLinks,       setSocialLinks]       = useState<Record<string, string>>({});
  const [isLoading,         setIsLoading]         = useState(true);
  const [isSaving,          setIsSaving]          = useState(false);
  const [loadError,         setLoadError]         = useState<string | null>(null);
  const [fieldErrors,       setFieldErrors]       = useState<Record<string, string>>({});

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
        const res = await getMyOrganizerProfile();
        if (res.success && res.data?.organizerProfile) {
          const p = res.data.organizerProfile;
          setDescription(p.description || '');
          setWebsite(p.website || '');
          setSocialLinks((p.socialLinks as Record<string, string>) || {});
          setLocation2(p.location || '');
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
        setLoadError('Could not load your profile. Please refresh the page and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (state?.message) window.history.replaceState({}, document.title);
  }, [state]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!organizationName.trim()) {
      errors.organizationName = 'Organization name is required.';
    }
    if (businessEmail.trim() && !isValidEmail(businessEmail.trim())) {
      errors.businessEmail = 'Please enter a valid email address.';
    }
    if (website.trim() && !isValidUrl(website.trim())) {
      errors.website = 'Please enter a valid URL (e.g. https://yourwebsite.com).';
    }
    for (const platform of SOCIAL_PLATFORMS) {
      const val = socialLinks[platform.key]?.trim();
      if (val && !isValidUrl(val)) {
        errors[`social_${platform.key}`] = 'Please enter a valid URL.';
      }
    }
    if (getTextLength(description) > 2000) {
      errors.description = 'Description must be 2000 characters or fewer.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleAvatarUploadComplete = async (url: string) => {
    setAvatar(url);
    try {
      await authApi.updateProfile({ avatar: url });
      await refreshProfile();
    } catch (error) {
      showErrorToast(toast, error, 'Photo uploaded but could not be saved. Please try again.');
    }
  };

  const handleAvatarRemove = async () => {
    setAvatar(null);
    try {
      await authApi.updateProfile({ avatar: '' });
      await refreshProfile();
    } catch (error) {
      showErrorToast(toast, error, 'Could not remove photo. Please try again.');
    }
  };

  const handleSave = async (navigateTo: 'dashboard' | 'kyc') => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await authApi.updateProfile({
        organizationName:   organizationName || undefined,
        phoneNumber:        phone || undefined,
        companyAffiliation: companyAffiliation || undefined,
        businessEmail:      businessEmail || undefined,
      });
    } catch (error) {
      showErrorToast(toast, error, 'Failed to save profile details. Please try again.');
      setIsSaving(false);
      return;
    }

    try {
      const filteredLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([, v]) => v?.trim())
      );
      await updateMyOrganizerProfile({
        description:  description || undefined,
        website:      website || undefined,
        location:     location2 || undefined,
        socialLinks:  Object.keys(filteredLinks).length > 0 ? filteredLinks : undefined,
        markComplete: true,
      });
    } catch (error) {
      showErrorToast(toast, error, 'Your basic info was saved, but online presence details could not be saved. Please try again.');
      setIsSaving(false);
      return;
    }

    try {
      await refreshProfile();
    } catch {
      // Non-fatal — profile data is already saved
    }

    toast({ title: 'Profile saved', description: 'Your organizer profile has been saved.' });
    setIsSaving(false);
    if (navigateTo === 'kyc') {
      navigate('/organizer/kyc', { state: { fromProfileSetup: true } });
    } else {
      navigate('/user/dashboard', { state: { message: 'Profile completed successfully!' } });
    }
  };

  const entityType  = user?.organizerEntityType;
  const isIndividual = !entityType || entityType === 'INDIVIDUAL';
  const displayName = organizationName.trim() ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');

  const completionChecks = [
    { label: 'Organization name',       done: organizationName.trim().length > 0 },
    { label: 'About & online presence', done: getTextLength(description) > 0 || website.trim().length > 0 },
    { label: 'Contact info',            done: phone.trim().length > 0 },
  ];
  const completedCount = completionChecks.filter((c) => c.done).length;
  const canSave = !isSaving && organizationName.trim().length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  /* ── Shared action buttons (rendered in both sidebar and mobile footer) ── */
  const ActionButtons = () => (
    <div className="space-y-2.5">
      <Button onClick={() => handleSave('dashboard')} disabled={!canSave} className="w-full h-11">
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        Save Profile
      </Button>
      <Button
        variant="outline"
        onClick={() => handleSave('kyc')}
        disabled={!canSave}
        className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5"
      >
        <Shield className="mr-2 h-4 w-4" />
        Save &amp; Start Verification
        <ArrowRight className="ml-auto h-4 w-4" />
      </Button>
      <button
        type="button"
        onClick={() => navigate('/user/dashboard')}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
      >
        I&apos;ll do this later
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

      {state?.message && (
        <Alert className="mb-6 border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700 dark:text-emerald-400">
            {state.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Page header */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary/70 mb-1.5">
          Organizer Setup
        </p>
        <h1 className="text-2xl font-bold text-foreground">Set Up Your Organizer Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This information appears on your event pages and helps attendees learn about you.
        </p>
      </div>

      {/* ── Mobile: compact progress strip ── */}
      <div className="lg:hidden mb-5 rounded-2xl border border-gray-200 dark:border-border/50 bg-white dark:bg-card p-4 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Profile completion
          </span>
          <span className="text-xs font-semibold text-primary">{completedCount}/{completionChecks.length}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / completionChecks.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {completionChecks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5">
              {c.done
                ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                : <Circle className="w-3.5 h-3.5 text-border shrink-0" />}
              <span className={`text-xs ${c.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">

        {/* ── LEFT PANEL — desktop only, sticky ── */}
        <div className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-24">

          {/* Identity card */}
          <div className="rounded-2xl border border-gray-200 dark:border-border/50 bg-white dark:bg-card p-6 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <AvatarUpload
              currentAvatar={avatar}
              onUploadComplete={handleAvatarUploadComplete}
              onRemove={handleAvatarRemove}
              isLogo={!isIndividual}
              size="sm"
              label={isIndividual ? 'Profile Photo' : 'Company Logo'}
              hint="Shown on your profile and event pages."
            />
            {displayName && (
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                {entityType && (
                  <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                    {formatEntityType(entityType)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress card */}
          <div className="rounded-2xl border border-gray-200 dark:border-border/50 bg-white dark:bg-card p-5 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                Completion
              </p>
              <span className="text-xs font-semibold text-primary">
                {completedCount}/{completionChecks.length}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedCount / completionChecks.length) * 100}%` }}
              />
            </div>
            <ul className="space-y-2.5">
              {completionChecks.map((c) => (
                <li key={c.label} className="flex items-center gap-2.5">
                  {c.done
                    ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-border shrink-0" />}
                  <span className={`text-xs leading-snug ${c.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-gray-200 dark:border-border/50 bg-white dark:bg-card p-5 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <ActionButtons />
          </div>
        </div>

        {/* ── RIGHT PANEL — form sections ── */}
        <div className="space-y-5">

          {/* Avatar upload on mobile (full width) */}
          <div className="lg:hidden rounded-2xl border border-gray-200 dark:border-border/40 bg-white dark:bg-card p-6 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {isIndividual ? 'Profile Photo' : 'Company Logo'}
            </h3>
            <AvatarUpload
              currentAvatar={avatar}
              onUploadComplete={handleAvatarUploadComplete}
              onRemove={handleAvatarRemove}
              isLogo={!isIndividual}
              label={isIndividual ? 'Profile Photo' : 'Company Logo'}
              hint={
                isIndividual
                  ? 'Your photo will appear on your profile and all event pages.'
                  : 'Your logo will appear on all your event pages and attendee communications.'
              }
            />
          </div>

          {/* Organizer Identity */}
          <div className="rounded-2xl border border-gray-200 dark:border-border/40 bg-white dark:bg-card p-6 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground">Organizer Identity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                How you appear publicly across all your events.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="orgName">
                  {isIndividual ? 'Organizer / Brand Name' : 'Legal / Registered Name'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="orgName"
                  value={organizationName}
                  onChange={(e) => { setOrganizationName(e.target.value); clearFieldError('organizationName'); }}
                  placeholder={isIndividual ? 'Your name or brand name' : 'Registered company name'}
                  className={`mt-1.5 ${fieldErrors.organizationName ? 'border-destructive' : ''}`}
                />
                {fieldErrors.organizationName ? (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.organizationName}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isIndividual
                      ? 'This is how attendees will identify you on event pages.'
                      : 'Your official name as it appears on legal documents.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessEmail">
                    Business Email{' '}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => { setBusinessEmail(e.target.value); clearFieldError('businessEmail'); }}
                    placeholder="contact@yourorganization.com"
                    className={`mt-1.5 ${fieldErrors.businessEmail ? 'border-destructive' : ''}`}
                  />
                  {fieldErrors.businessEmail ? (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.businessEmail}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Public-facing contact for attendees.</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">
                    Location{' '}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="location"
                    value={location2}
                    onChange={(e) => setLocation2(e.target.value)}
                    placeholder="Nairobi, Kenya"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About & Online Presence */}
          <div className="rounded-2xl border border-gray-200 dark:border-border/40 bg-white dark:bg-card p-6 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground">About & Online Presence</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tell attendees your story and where to find you online.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="description">About Your Organization</Label>
                <div className="mt-1.5">
                  <RichTextEditor
                    content={description}
                    onChange={(val) => { setDescription(val); clearFieldError('description'); }}
                    placeholder="Tell attendees about your organization, the events you host, and what makes them special..."
                    minHeight="120px"
                  />
                </div>
                {fieldErrors.description ? (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.description}</p>
                ) : (
                  <p className={`text-xs mt-1 ${getTextLength(description) > 2000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {getTextLength(description)}/2000 characters
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => { setWebsite(e.target.value); clearFieldError('website'); }}
                    placeholder="https://yourwebsite.com"
                    className={`pl-10 ${fieldErrors.website ? 'border-destructive' : ''}`}
                  />
                </div>
                {fieldErrors.website && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.website}</p>
                )}
              </div>

              <div>
                <Label className="mb-3 block">Social Media Links</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <div key={platform.key}>
                      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {platform.label}
                      </span>
                      <Input
                        value={socialLinks[platform.key] || ''}
                        onChange={(e) => {
                          setSocialLinks((prev) => ({ ...prev, [platform.key]: e.target.value }));
                          clearFieldError(`social_${platform.key}`);
                        }}
                        placeholder={platform.placeholder}
                        className={fieldErrors[`social_${platform.key}`] ? 'border-destructive' : ''}
                      />
                      {fieldErrors[`social_${platform.key}`] && (
                        <p className="text-xs text-destructive mt-1">{fieldErrors[`social_${platform.key}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-2xl border border-gray-200 dark:border-border/40 bg-white dark:bg-card p-6 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground">Contact</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Private details used for admin communication only. Not shown publicly.
              </p>
            </div>

            <div className={`grid grid-cols-1 gap-4 ${isIndividual ? 'sm:grid-cols-2' : ''}`}>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="mt-1.5">
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="712 345 678"
                  />
                </div>
              </div>

              {isIndividual && (
                <div>
                  <Label htmlFor="companyAffiliation">
                    Company Affiliation{' '}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="companyAffiliation"
                    value={companyAffiliation}
                    onChange={(e) => setCompanyAffiliation(e.target.value)}
                    placeholder="Your employer or institution"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mobile: action buttons at the bottom of the form */}
          <div className="lg:hidden rounded-2xl border border-gray-200 dark:border-border/50 bg-white dark:bg-card p-5 shadow-[0_1px_3px_rgba(27,31,36,0.12),0_1px_0_rgba(27,31,36,0.04)] dark:shadow-none">
            <ActionButtons />
          </div>

        </div>
      </div>
    </div>
  );
}
