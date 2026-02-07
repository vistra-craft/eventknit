import { useEffect } from 'react';

interface MetaTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

/**
 * Custom hook to dynamically set meta tags for social media sharing (Open Graph, Twitter Cards)
 * Similar to Next.js generateMetadata but for React Router
 */
export const useMetaTags = ({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'EventKnit',
}: MetaTags) => {
  useEffect(() => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    const fullUrl = url || window.location.href;
    const fullImageUrl = image ? (image.startsWith('http') ? image : `${frontendUrl}${image}`) : undefined;

    // Set or update meta tags
    const setMetaTag = (property: string, content: string) => {
      if (!content) return;
      
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const setMetaName = (name: string, content: string) => {
      if (!content) return;
      
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update document title
    if (title) {
      document.title = `${title} | ${siteName}`;
    }

    // Basic meta tags
    setMetaName('description', description || '');

    // Open Graph tags (Facebook, LinkedIn, etc.)
    setMetaTag('og:title', title || '');
    setMetaTag('og:description', description || '');
    if (fullImageUrl) {
      setMetaTag('og:image', fullImageUrl);
      setMetaTag('og:image:width', '1200');
      setMetaTag('og:image:height', '630');
      setMetaTag('og:image:alt', title || '');
    }
    setMetaTag('og:url', fullUrl);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', siteName);

    // Twitter Card tags
    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', title || '');
    setMetaName('twitter:description', description || '');
    if (fullImageUrl) {
      setMetaName('twitter:image', fullImageUrl);
    }

    // Cleanup function to restore default meta tags when component unmounts
    return () => {
      // Optionally restore default title
      document.title = `${siteName} - Event Management Platform`;
    };
  }, [title, description, image, url, type, siteName]);
};





