import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { getUsers } from '@/lib/admin-api';
import {
  adminUpsertBranding,
  type CreateBrandingData,
  type WhiteLabelBranding,
  type OrganizerInfo,
} from '@/lib/white-label-api';
import { Search, Palette, Type, Mail, Share2 } from 'lucide-react';
import BrandingPreview from './BrandingPreview';

interface BrandingSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBranding?: (WhiteLabelBranding & { organizer?: OrganizerInfo }) | null;
  onSuccess: () => void;
}

const EMPTY_FORM: CreateBrandingData = {
  brandName: '',
  tagline: '',
  logoUrl: '',
  logoLightUrl: '',
  logoDarkUrl: '',
  faviconUrl: '',
  coverImageUrl: '',
  primaryColor: '#4a6cf7',
  secondaryColor: '#1a1a2e',
  accentColor: '#f4a261',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  linkColor: '#4a6cf7',
  fontFamily: '',
  headingFont: '',
  supportEmail: '',
  supportPhone: '',
  websiteUrl: '',
  emailHeaderImage: '',
  emailFooterText: '',
  emailSignature: '',
  socialLinks: {},
};

interface OrganizerOption {
  id: string;
  label: string;
  email: string;
}

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded border cursor-pointer bg-transparent"
      />
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#FF5733"
        className="font-mono text-xs w-24"
      />
    </div>
  </div>
);

const BrandingSetupDialog = ({
  open,
  onOpenChange,
  editBranding,
  onSuccess,
}: BrandingSetupDialogProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CreateBrandingData>(EMPTY_FORM);
  const [activeSection, setActiveSection] = useState<string>('identity');

  // Organizer selector state
  const [organizerId, setOrganizerId] = useState('');
  const [organizerSearch, setOrganizerSearch] = useState('');
  const [organizers, setOrganizers] = useState<OrganizerOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [selectedOrgLabel, setSelectedOrgLabel] = useState('');

  const isEditMode = !!editBranding;

  // Reset form when dialog opens/closes or editBranding changes
  useEffect(() => {
    if (open) {
      if (editBranding) {
        setOrganizerId(editBranding.organizerId);
        setSelectedOrgLabel(
          editBranding.organizer
            ? editBranding.organizer.organizationName ||
              `${editBranding.organizer.firstName} ${editBranding.organizer.lastName}`
            : editBranding.organizerId,
        );
        setFormData({
          brandName: editBranding.brandName || '',
          tagline: editBranding.tagline || '',
          logoUrl: editBranding.logoUrl || '',
          logoLightUrl: editBranding.logoLightUrl || '',
          logoDarkUrl: editBranding.logoDarkUrl || '',
          faviconUrl: editBranding.faviconUrl || '',
          coverImageUrl: editBranding.coverImageUrl || '',
          primaryColor: editBranding.primaryColor || '#4a6cf7',
          secondaryColor: editBranding.secondaryColor || '#1a1a2e',
          accentColor: editBranding.accentColor || '#f4a261',
          backgroundColor: editBranding.backgroundColor || '#ffffff',
          textColor: editBranding.textColor || '#333333',
          linkColor: editBranding.linkColor || '#4a6cf7',
          fontFamily: editBranding.fontFamily || '',
          headingFont: editBranding.headingFont || '',
          supportEmail: editBranding.supportEmail || '',
          supportPhone: editBranding.supportPhone || '',
          websiteUrl: editBranding.websiteUrl || '',
          emailHeaderImage: editBranding.emailHeaderImage || '',
          emailFooterText: editBranding.emailFooterText || '',
          emailSignature: editBranding.emailSignature || '',
          socialLinks: editBranding.socialLinks || {},
        });
      } else {
        setOrganizerId('');
        setSelectedOrgLabel('');
        setOrganizerSearch('');
        setFormData(EMPTY_FORM);
      }
      setActiveSection('identity');
    }
  }, [open, editBranding]);

  // Debounced organizer search
  const searchOrganizers = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setOrganizers([]);
      return;
    }
    setIsSearching(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await getUsers({ role: 'ORGANIZER' as any, search: term, limit: 15 });
      const users = res?.data?.users || [];
      setOrganizers(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        users.map((u: any) => ({
          id: u.id,
          label: u.organizationName || `${u.firstName} ${u.lastName}`,
          email: u.email,
        })),
      );
    } catch {
      setOrganizers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (organizerSearch) searchOrganizers(organizerSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [organizerSearch, searchOrganizers]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: keyof CreateBrandingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: url },
    }));
  };

  const handleSubmit = async () => {
    if (!organizerId) {
      toast({ title: 'Error', description: 'Please select an organizer', variant: 'destructive' });
      return;
    }

    // Clean empty strings from data
    const cleanData: CreateBrandingData = {};
    for (const [key, value] of Object.entries(formData)) {
      if (key === 'socialLinks') {
        const links = value as Record<string, string>;
        const cleaned: Record<string, string> = {};
        for (const [k, v] of Object.entries(links)) {
          if (v) cleaned[k] = v;
        }
        if (Object.keys(cleaned).length > 0) cleanData.socialLinks = cleaned;
      } else if (value !== '' && value !== undefined && value !== null) {
        (cleanData as Record<string, unknown>)[key] = value;
      }
    }

    setIsSaving(true);
    try {
      await adminUpsertBranding(organizerId, cleanData);
      toast({
        title: 'Success',
        description: isEditMode
          ? 'Branding updated and activated'
          : 'Branding created and activated for organizer',
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const message = err?.response?.data?.error || err?.message;
      toast({
        title: 'Error',
        description: message || 'Failed to save branding',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'identity', label: 'Identity', icon: Palette },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Fonts', icon: Type },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'social', label: 'Social', icon: Share2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Branding' : 'Set Up Branding for Organizer'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update branding settings. Changes are auto-approved.'
              : 'Configure branding on behalf of an organizer. Branding will be auto-approved and activated.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Organizer Selector */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label>Select Organizer *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={organizerId ? selectedOrgLabel : organizerSearch}
                  onChange={(e) => {
                    if (organizerId) {
                      setOrganizerId('');
                      setSelectedOrgLabel('');
                    }
                    setOrganizerSearch(e.target.value);
                    setShowOrgDropdown(true);
                  }}
                  onFocus={() => setShowOrgDropdown(true)}
                  placeholder="Search organizers by name or email..."
                  className="pl-9"
                />
                {showOrgDropdown && organizers.length > 0 && !organizerId && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {organizers.map((org) => (
                      <button
                        key={org.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between items-center"
                        onClick={() => {
                          setOrganizerId(org.id);
                          setSelectedOrgLabel(org.label);
                          setOrganizerSearch('');
                          setShowOrgDropdown(false);
                        }}
                      >
                        <span className="font-medium">{org.label}</span>
                        <span className="text-xs text-muted-foreground">{org.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>
            </div>
          )}

          {isEditMode && (
            <div className="text-sm text-muted-foreground">
              Organizer: <span className="font-medium text-foreground">{selectedOrgLabel}</span>
            </div>
          )}

          {/* Section Tabs */}
          <div className="flex gap-1 border-b pb-1 overflow-x-auto">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t transition-colors whitespace-nowrap ${
                  activeSection === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Form */}
            <div className="lg:col-span-2 space-y-4">
              {activeSection === 'identity' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Brand Name</Label>
                      <Input
                        value={formData.brandName || ''}
                        onChange={(e) => updateField('brandName', e.target.value)}
                        placeholder="My Brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tagline</Label>
                      <Input
                        value={formData.tagline || ''}
                        onChange={(e) => updateField('tagline', e.target.value)}
                        placeholder="Events made simple"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Logo URL</Label>
                    <Input
                      value={formData.logoUrl || ''}
                      onChange={(e) => updateField('logoUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Logo (Light BG)</Label>
                      <Input
                        value={formData.logoLightUrl || ''}
                        onChange={(e) => updateField('logoLightUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Logo (Dark BG)</Label>
                      <Input
                        value={formData.logoDarkUrl || ''}
                        onChange={(e) => updateField('logoDarkUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Favicon URL</Label>
                      <Input
                        value={formData.faviconUrl || ''}
                        onChange={(e) => updateField('faviconUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cover Image URL</Label>
                      <Input
                        value={formData.coverImageUrl || ''}
                        onChange={(e) => updateField('coverImageUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'colors' && (
                <div className="grid grid-cols-3 gap-4">
                  <ColorField
                    label="Primary"
                    value={formData.primaryColor || ''}
                    onChange={(v) => updateField('primaryColor', v)}
                  />
                  <ColorField
                    label="Secondary"
                    value={formData.secondaryColor || ''}
                    onChange={(v) => updateField('secondaryColor', v)}
                  />
                  <ColorField
                    label="Accent"
                    value={formData.accentColor || ''}
                    onChange={(v) => updateField('accentColor', v)}
                  />
                  <ColorField
                    label="Background"
                    value={formData.backgroundColor || ''}
                    onChange={(v) => updateField('backgroundColor', v)}
                  />
                  <ColorField
                    label="Text"
                    value={formData.textColor || ''}
                    onChange={(v) => updateField('textColor', v)}
                  />
                  <ColorField
                    label="Link"
                    value={formData.linkColor || ''}
                    onChange={(v) => updateField('linkColor', v)}
                  />
                </div>
              )}

              {activeSection === 'typography' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Body Font</Label>
                    <Input
                      value={formData.fontFamily || ''}
                      onChange={(e) => updateField('fontFamily', e.target.value)}
                      placeholder="Inter, Poppins, Roboto..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Heading Font</Label>
                    <Input
                      value={formData.headingFont || ''}
                      onChange={(e) => updateField('headingFont', e.target.value)}
                      placeholder="Space Grotesk, Montserrat..."
                    />
                  </div>
                </div>
              )}

              {activeSection === 'contact' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Support Email</Label>
                      <Input
                        value={formData.supportEmail || ''}
                        onChange={(e) => updateField('supportEmail', e.target.value)}
                        placeholder="support@example.com"
                        type="email"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Support Phone</Label>
                      <Input
                        value={formData.supportPhone || ''}
                        onChange={(e) => updateField('supportPhone', e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Website URL</Label>
                    <Input
                      value={formData.websiteUrl || ''}
                      onChange={(e) => updateField('websiteUrl', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              )}

              {activeSection === 'email' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Email Header Image URL</Label>
                    <Input
                      value={formData.emailHeaderImage || ''}
                      onChange={(e) => updateField('emailHeaderImage', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email Footer Text</Label>
                    <Textarea
                      value={formData.emailFooterText || ''}
                      onChange={(e) => updateField('emailFooterText', e.target.value)}
                      placeholder="Thank you for choosing our events..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email Signature (HTML)</Label>
                    <Textarea
                      value={formData.emailSignature || ''}
                      onChange={(e) => updateField('emailSignature', e.target.value)}
                      placeholder="<p>The Events Team</p>"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {activeSection === 'social' && (
                <div className="space-y-3">
                  {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'].map(
                    (platform) => (
                      <div key={platform} className="space-y-1">
                        <Label className="text-xs capitalize">{platform}</Label>
                        <Input
                          value={formData.socialLinks?.[platform] || ''}
                          onChange={(e) => updateSocialLink(platform, e.target.value)}
                          placeholder={`https://${platform}.com/...`}
                        />
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <BrandingPreview data={formData} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || (!isEditMode && !organizerId)}>
            {isSaving
              ? 'Saving...'
              : isEditMode
                ? 'Update & Activate'
                : 'Create & Activate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BrandingSetupDialog;
