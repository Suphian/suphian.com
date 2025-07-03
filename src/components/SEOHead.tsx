import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SEOHead = ({ 
  title = "Suphian Tweel – Product Manager",
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
    updateMetaTag('keywords', 'Product Manager, YouTube, Payments, UX Design, Data Analytics, Technology, Portfolio, Professional Experience');
    updateMetaTag('author', 'Suphian Tweel');

    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:image:width', '400');
    updateMetaTag('og:image:height', '400');
    updateMetaTag('og:image:type', 'image/png');
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', 'profile');
    updateMetaTag('og:site_name', 'Suphian Tweel Portfolio');
    updateMetaTag('og:locale', 'en_US');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', 'Suphian Tweel - Product Manager at YouTube professional headshot');
    updateMetaTag('twitter:site', '@suphian');
    updateMetaTag('twitter:creator', '@suphian');

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('language', 'English');
    updateMetaTag('revisit-after', '7 days');
    updateMetaTag('distribution', 'global');
    updateMetaTag('rating', 'general');

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = url;

    // Enhanced structured data with more SEO value
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Suphian Tweel",
      "jobTitle": "Product Manager",
      "worksFor": {
        "@type": "Organization",
        "name": "YouTube",
        "@id": "https://www.youtube.com",
        "url": "https://www.youtube.com"
      },
      "description": description,
      "url": url,
      "image": {
        "@type": "ImageObject",
        "url": image,
        "width": 400,
        "height": 400
      },
      "alumniOf": {
        "@type": "Organization",
        "name": "University"
      },
      "knowsAbout": [
        "Product Management",
        "Digital Payments",
        "User Experience Design",
        "Data Analytics",
        "Technology Strategy",
        "YouTube Platform"
      ],
      "sameAs": [
        "https://www.linkedin.com/in/suphian/",
        "https://github.com/Suphian"
      ]
    };

    // Add WebSite structured data for search box
    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Suphian Tweel Portfolio",
      "url": url,
      "author": {
        "@type": "Person",
        "name": "Suphian Tweel"
      },
      "description": description,
      "inLanguage": "en-US"
    };

    // Add or update Person structured data
    let structuredDataScript = document.querySelector('#structured-data-person') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'structured-data-person';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

    // Add or update Website structured data
    let websiteDataScript = document.querySelector('#structured-data-website') as HTMLScriptElement;
    if (!websiteDataScript) {
      websiteDataScript = document.createElement('script');
      websiteDataScript.id = 'structured-data-website';
      websiteDataScript.type = 'application/ld+json';
      document.head.appendChild(websiteDataScript);
    }
    websiteDataScript.textContent = JSON.stringify(websiteData);

  }, [title, description, image, url]);

  return null;
};

export default SEOHead;