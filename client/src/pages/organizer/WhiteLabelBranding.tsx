import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getBranding,
  upsertBranding,
  type WhiteLabelBranding,
  type CreateBrandingData,
} from '@/lib/white-label-api';
import { Save, Palette, Mail, Globe, Image as ImageIcon, AlertCircle } from 'lucide-react';
import OrganizerLayout from './OrganizerLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WhiteLabelBranding = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [branding, setBranding] = useState<WhiteLabelBranding | null>(null);
  const [formData, setFormData] = useState<CreateBrandingData>({
    logoUrl: '',
    logoLightUrl: '',
    logoDarkUrl: '',
    faviconUrl: '',
    coverImageUrl: '',
    primaryColor: '#4a6cf7',
    secondaryColor: '#6c757d',
    accentColor: '#ffc107',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    linkColor: '#4a6cf7',
    fontFamily: '',
    headingFont: '',
    brandName: '',
    tagline: '',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
    emailHeaderImage: '',
    emailFooterText: '',
    emailSignature: '',
    socialLinks: {},
  });

  const loadBranding = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getBranding();
      setBranding(data);
      setFormData({
        logoUrl: data.logoUrl || '',
        logoLightUrl: data.logoLightUrl || '',
        logoDarkUrl: data.logoDarkUrl || '',
        faviconUrl: data.faviconUrl || '',
        coverImageUrl: data.coverImageUrl || '',
        primaryColor: data.primaryColor || '#4a6cf7',
        secondaryColor: data.secondaryColor || '#6c757d',
        accentColor: data.accentColor || '#ffc107',
        backgroundColor: data.backgroundColor || '#ffffff',
        textColor: data.textColor || '#333333',
        linkColor: data.linkColor || '#4a6cf7',
        fontFamily: data.fontFamily || '',
        headingFont: data.headingFont || '',
        brandName: data.brandName || '',
        tagline: data.tagline || '',
        supportEmail: data.supportEmail || '',
        supportPhone: data.supportPhone || '',
        websiteUrl: data.websiteUrl || '',
        emailHeaderImage: data.emailHeaderImage || '',
        emailFooterText: data.emailFooterText || '',
        emailSignature: data.emailSignature || '',
        socialLinks: data.socialLinks || {},
      });
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast({
        title: 'Error',
        description: message || 'Failed to load branding',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await upsertBranding(formData);
      setBranding(updated);
      toast({
        title: 'Success',
        description: 'Branding updated successfully. Pending admin approval.',
      });
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast({
        title: 'Error',
        description: message || 'Failed to save branding',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof CreateBrandingData, value: CreateBrandingData[keyof CreateBrandingData]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: url },
    }));
  };

  if (isLoading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading branding settings...</div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">White-Label Branding</h1>
            <p className="text-muted-foreground mt-1">
              Customize your brand appearance across the platform
            </p>
          </div>
          {branding && (
            <Badge
              variant={
                branding.status === 'ACTIVE'
                  ? 'default'
                  : branding.status === 'PENDING_APPROVAL'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {branding.status === 'ACTIVE'
                ? 'Active'
                : branding.status === 'PENDING_APPROVAL'
                ? 'Pending Approval'
                : 'Inactive'}
            </Badge>
          )}
        </div>

        {branding?.status === 'PENDING_APPROVAL' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Pending Approval</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your branding changes are pending admin approval. Once approved, they will be
                    active across the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="email">Email Branding</TabsTrigger>
            <TabsTrigger value="social">Social Links</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Brand Assets
                </CardTitle>
                <CardDescription>
                  Upload your logos, favicon, and cover images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Main Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => updateField('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoLightUrl">Logo (Light Background)</Label>
                    <Input
                      id="logoLightUrl"
                      value={formData.logoLightUrl}
                      onChange={(e) => updateField('logoLightUrl', e.target.value)}
                      placeholder="https://example.com/logo-light.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoDarkUrl">Logo (Dark Background)</Label>
                    <Input
                      id="logoDarkUrl"
                      value={formData.logoDarkUrl}
                      onChange={(e) => updateField('logoDarkUrl', e.target.value)}
                      placeholder="https://example.com/logo-dark.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      value={formData.faviconUrl}
                      onChange={(e) => updateField('faviconUrl', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                    <Input
                      id="coverImageUrl"
                      value={formData.coverImageUrl}
                      onChange={(e) => updateField('coverImageUrl', e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brand Information</CardTitle>
                <CardDescription>Basic brand details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={formData.brandName}
                      onChange={(e) => updateField('brandName', e.target.value)}
                      placeholder="Your Brand Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline}
                      onChange={(e) => updateField('tagline', e.target.value)}
                      placeholder="Your brand tagline"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => updateField('websiteUrl', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => updateField('supportEmail', e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      value={formData.supportPhone}
                      onChange={(e) => updateField('supportPhone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Scheme
                </CardTitle>
                <CardDescription>
                  Define your brand colors for consistent theming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                        placeholder="#4a6cf7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => updateField('secondaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => updateField('secondaryColor', e.target.value)}
                        placeholder="#6c757d"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => updateField('accentColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.accentColor}
                        onChange={(e) => updateField('accentColor', e.target.value)}
                        placeholder="#ffc107"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => updateField('backgroundColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.backgroundColor}
                        onChange={(e) => updateField('backgroundColor', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => updateField('textColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.textColor}
                        onChange={(e) => updateField('textColor', e.target.value)}
                        placeholder="#333333"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkColor">Link Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="linkColor"
                        type="color"
                        value={formData.linkColor}
                        onChange={(e) => updateField('linkColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.linkColor}
                        onChange={(e) => updateField('linkColor', e.target.value)}
                        placeholder="#4a6cf7"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Customize fonts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Primary Font Family</Label>
                    <Input
                      id="fontFamily"
                      value={formData.fontFamily}
                      onChange={(e) => updateField('fontFamily', e.target.value)}
                      placeholder="Arial, sans-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headingFont">Heading Font</Label>
                    <Input
                      id="headingFont"
                      value={formData.headingFont}
                      onChange={(e) => updateField('headingFont', e.target.value)}
                      placeholder="Georgia, serif"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Branding
                </CardTitle>
                <CardDescription>
                  Customize how your emails appear to recipients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailHeaderImage">Email Header Image URL</Label>
                  <Input
                    id="emailHeaderImage"
                    value={formData.emailHeaderImage}
                    onChange={(e) => updateField('emailHeaderImage', e.target.value)}
                    placeholder="https://example.com/email-header.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFooterText">Email Footer Text</Label>
                  <Textarea
                    id="emailFooterText"
                    value={formData.emailFooterText}
                    onChange={(e) => updateField('emailFooterText', e.target.value)}
                    placeholder="Thank you for using our platform!"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSignature">Email Signature (HTML)</Label>
                  <Textarea
                    id="emailSignature"
                    value={formData.emailSignature}
                    onChange={(e) => updateField('emailSignature', e.target.value)}
                    placeholder="<p>Best regards,<br/>Your Team</p>"
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>
                  Add your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((platform) => (
                  <div key={platform} className="space-y-2">
                    <Label htmlFor={`social-${platform}`}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)} URL
                    </Label>
                    <Input
                      id={`social-${platform}`}
                      value={formData.socialLinks?.[platform] || ''}
                      onChange={(e) => updateSocialLink(platform, e.target.value)}
                      placeholder={`https://${platform}.com/yourprofile`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={loadBranding}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default WhiteLabelBranding;

