import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Facebook, Twitter, Instagram, Linkedin, Globe, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SocialConnectionsStepProps {
  socialLinks: Record<string, string>;
  onChange: (links: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SocialConnectionsStep: React.FC<SocialConnectionsStepProps> = ({
  socialLinks,
  onChange,
  onNext,
  onBack
}) => {
  const { user } = useAuth();
  
  // Pre-fill from user profile if available and not already set
  // This is a placeholder for when we have organization social links in the user profile
  // useEffect(() => {
  //   if (user?.organization?.socialLinks && Object.keys(socialLinks).length === 0) {
  //     onChange(user.organization.socialLinks);
  //   }
  // }, [user]);

  const handleLinkChange = (platform: string, value: string) => {
    onChange({
      ...socialLinks,
      [platform]: value
    });
  };

  const socialPlatforms = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/your-page' },
    { id: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/your-handle' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/your-handle' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/your-company' },
    { id: 'tiktok', label: 'TikTok', icon: MessageCircle, placeholder: 'https://tiktok.com/@your-handle' },
    { id: 'website', label: 'Website', icon: Globe, placeholder: 'https://your-website.com' }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Connect Social Media
        </h2>
        <p className="text-muted-foreground">
          Add your social media profiles to help attendees connect with you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Profiles</CardTitle>
          <CardDescription>
            These links will be displayed prominently on your event page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.id} className="space-y-2">
                  <Label htmlFor={`social-${platform.id}`} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {platform.label}
                  </Label>
                  <Input
                    id={`social-${platform.id}`}
                    placeholder={platform.placeholder}
                    value={socialLinks[platform.id] || ''}
                    onChange={(e) => handleLinkChange(platform.id, e.target.value)}
                    className="transition-all duration-200 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
