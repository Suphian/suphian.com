import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SEOHead = ({ 
  title = "Suphian Tweel - Product Manager at YouTube",
  description = "Product Manager leading payments at YouTube. Passionate about crafting exceptional user experiences powered by data, design, and cutting-edge technology.",
  image = "/lovable-uploads/8edd0658-a313-4e0a-953c-1f12e87a1592.png",
  url = window.location.href
}: SEOHeadProps) => {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) || 
                 document.querySelector(`meta[name="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', 'Product Manager, YouTube, Payments, UX Design, Data Analytics, Technology');
    updateMetaTag('author', 'Suphian Tweel');

    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'Suphian Tweel Portfolio');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Suphian Tweel",
      "jobTitle": "Product Manager",
      "worksFor": {
        "@type": "Organization",
        "name": "YouTube"
      },
      "description": description,
      "url": url,
      "image": image,
      "sameAs": [
        "https://www.linkedin.com/in/suphian/",
        "https://github.com/Suphian"
      ]
    };

    // Add or update structured data
    let structuredDataScript = document.querySelector('#structured-data') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'structured-data';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

  }, [title, description, image, url]);

  return null;
};

export default SEOHead;