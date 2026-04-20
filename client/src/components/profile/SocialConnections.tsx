import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Linkedin, 
  Twitter, 
  Instagram, 
  Facebook, 
  Globe, 
  Mail,
  ExternalLink 
} from 'lucide-react';

interface SocialConnection {
  platform: string;
  url: string;
  label: string;
}

interface SocialConnectionsProps {
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  contactDetails?: {
    website?: string;
    email?: string;
    phone?: string;
  };
}

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return <Linkedin className="w-4 h-4" />;
    case 'twitter':
      return <Twitter className="w-4 h-4" />;
    case 'instagram':
      return <Instagram className="w-4 h-4" />;
    case 'facebook':
      return <Facebook className="w-4 h-4" />;
    case 'website':
      return <Globe className="w-4 h-4" />;
    case 'email':
      return <Mail className="w-4 h-4" />;
    default:
      return <ExternalLink className="w-4 h-4" />;
  }
};

const getSocialUrl = (platform: string, handle: string) => {
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return `https://linkedin.com/in/${handle}`;
    case 'twitter':
      return `https://twitter.com/${handle.replace('@', '')}`;
    case 'instagram':
      return `https://instagram.com/${handle.replace('@', '')}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'tiktok':
      return `https://tiktok.com/@${handle.replace('@', '')}`;
    default:
      return handle;
  }
};

export const SocialConnections: React.FC<SocialConnectionsProps> = ({ 
  socialLinks, 
  contactDetails
}) => {
  const connections: SocialConnection[] = [];

  // Add social media links
  if (socialLinks) {
    Object.entries(socialLinks).forEach(([platform, handle]) => {
      if (handle) {
        const url = getSocialUrl(platform, handle);
        connections.push({
          platform: platform,
          url,
          label: platform.charAt(0).toUpperCase() + platform.slice(1)
        });
      }
    });
  }

  // Add contact details
  if (contactDetails) {
    if (contactDetails.website) {
      connections.push({
        platform: 'website',
        url: contactDetails.website,
        label: 'Website'
      });
    }
    if (contactDetails.email) {
      connections.push({
        platform: 'email',
        url: `mailto:${contactDetails.email}`,
        label: 'Email'
      });
    }
  }

  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Connect with me</h3>
      <div className="flex flex-wrap gap-2">
        {connections.map((connection, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              window.open(connection.url, '_blank', 'noopener,noreferrer');
            }}
          >
            {getSocialIcon(connection.platform)}
            {connection.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
