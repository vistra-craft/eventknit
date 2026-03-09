import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';
import {
  getBranding,
  upsertBranding,
  getCustomDomains,
  addCustomDomain,
  deleteCustomDomain,
  type CreateBrandingData,
  type WhiteLabelBranding,
  type CustomDomain,
} from '@/lib/white-label-api';
import BrandingPreview from '../admin/white-label/BrandingPreview';
import {
  Palette,
  Type,
  Mail,
  Share2,
  Globe,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

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

const StatusBadge = ({ status }: { status: WhiteLabelBranding['status'] }) => {
  const config = {
    ACTIVE: { label: 'Active', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    PENDING_APPROVAL: { label: 'Pending Approval', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    INACTIVE: { label: 'Inactive', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  }[status];

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

const OrganizerBrandingPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState<WhiteLabelBranding | null>(null);
  const [formData, setFormData] = useState<CreateBrandingData>(EMPTY_FORM);
  const [activeSection, setActiveSection] = useState('identity');

  // Custom domains state
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [activeTab, setActiveTab] = useState<'branding' | 'domains'>('branding');
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [brandingRes, domainsRes] = await Promise.allSettled([
        getBranding(),
        getCustomDomains(),
      ]);

      if (brandingRes.status === 'fulfilled' && brandingRes.value?.data) {
        const b = brandingRes.value.data;
        setBranding(b);
        setFormData({
          brandName: b.brandName || '',
          tagline: b.tagline || '',
          logoUrl: b.logoUrl || '',
          logoLightUrl: b.logoLightUrl || '',
          logoDarkUrl: b.logoDarkUrl || '',
          faviconUrl: b.faviconUrl || '',
          coverImageUrl: b.coverImageUrl || '',
          primaryColor: b.primaryColor || '#4a6cf7',
          secondaryColor: b.secondaryColor || '#1a1a2e',
          accentColor: b.accentColor || '#f4a261',
          backgroundColor: b.backgroundColor || '#ffffff',
          textColor: b.textColor || '#333333',
          linkColor: b.linkColor || '#4a6cf7',
          fontFamily: b.fontFamily || '',
          headingFont: b.headingFont || '',
          supportEmail: b.supportEmail || '',
          supportPhone: b.supportPhone || '',
          websiteUrl: b.websiteUrl || '',
          emailHeaderImage: b.emailHeaderImage || '',
          emailFooterText: b.emailFooterText || '',
          emailSignature: b.emailSignature || '',
          socialLinks: b.socialLinks || {},
        });
      }

      if (domainsRes.status === 'fulfilled' && domainsRes.value?.data) {
        setDomains(Array.isArray(domainsRes.value.data) ? domainsRes.value.data : []);
      }
    } catch {
      // Branding may not exist yet — that's fine
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateBrandingData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: url },
    }));
  };

  const handleSave = async () => {
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

    setSaving(true);
    try {
      const res = await upsertBranding(cleanData);
      if (res?.data) {
        setBranding(res.data);
      }
      toast({
        title: 'Branding saved',
        description: branding
          ? 'Your branding has been updated and submitted for approval.'
          : 'Your branding has been created and submitted for approval.',
      });
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    try {
      await addCustomDomain({ domain: newDomain.trim() });
      setNewDomain('');
      toast({ title: 'Domain added', description: 'Your custom domain has been submitted for verification.' });
      const res = await getCustomDomains();
      if (res?.data) setDomains(Array.isArray(res.data) ? res.data : []);
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      await deleteCustomDomain(domainId);
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      toast({ title: 'Domain removed' });
    } catch (error) {
      showErrorToast(toast, error, 'Failed to delete domain');
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

  const domainStatusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    VERIFIED: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    SUSPENDED: { label: 'Suspended', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your event pages with your own brand identity
          </p>
        </div>
        {branding && <StatusBadge status={branding.status} />}
      </div>

      {branding?.status === 'INACTIVE' && branding.rejectionReason && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Branding Rejected</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{branding.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'branding'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4 inline mr-2" />
          Branding
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'domains'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="h-4 w-4 inline mr-2" />
          Custom Domains
        </button>
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <ColorField label="Primary" value={formData.primaryColor || ''} onChange={(v) => updateField('primaryColor', v)} />
                  <ColorField label="Secondary" value={formData.secondaryColor || ''} onChange={(v) => updateField('secondaryColor', v)} />
                  <ColorField label="Accent" value={formData.accentColor || ''} onChange={(v) => updateField('accentColor', v)} />
                  <ColorField label="Background" value={formData.backgroundColor || ''} onChange={(v) => updateField('backgroundColor', v)} />
                  <ColorField label="Text" value={formData.textColor || ''} onChange={(v) => updateField('textColor', v)} />
                  <ColorField label="Link" value={formData.linkColor || ''} onChange={(v) => updateField('linkColor', v)} />
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

              <div className="pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : branding ? (
                    'Update Branding'
                  ) : (
                    'Save Branding'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Changes will be submitted for admin approval before going live.
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <BrandingPreview data={formData} />
            </div>
          </div>
        </div>
      )}

      {/* Custom Domains Tab */}
      {activeTab === 'domains' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border/40 bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Add Custom Domain</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Point your domain to EventKnit to host your event pages on your own domain.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="events.yourdomain.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              />
              <Button onClick={handleAddDomain} disabled={addingDomain || !newDomain.trim()}>
                {addingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Add
              </Button>
            </div>
          </div>

          {domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No custom domains configured yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => {
                const statusCfg = domainStatusConfig[domain.status] || domainStatusConfig.PENDING;
                return (
                  <div key={domain.id} className="rounded-lg border border-border/40 bg-card p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{domain.domain}</span>
                        {domain.isPrimary && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded">PRIMARY</span>
                        )}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      {domain.cnameTarget && (
                        <p className="text-xs text-muted-foreground">
                          CNAME: <code className="bg-muted px-1 rounded">{domain.cnameTarget}</code>
                        </p>
                      )}
                      {domain.failureReason && (
                        <p className="text-xs text-red-600 dark:text-red-400">{domain.failureReason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizerBrandingPage;
