import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const SEOHead = ({ 
  title = "Suphian Tweel – Senior Product Manager",
  description = "Senior Product Manager at YouTube leading payments and AI initiatives. Expert in fintech, fraud detection, and growth for platforms like YouTube Shorts and Premium.",
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
    updateMetaTag('keywords', 'Senior Product Manager, YouTube Product Manager, AI Product Management, Fintech, Payments, Fraud Detection, Data Analytics, UX Design, Suphian Tweel, San Francisco Product Manager');
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
    updateMetaTag('profile:first_name', 'Suphian');
    updateMetaTag('profile:last_name', 'Tweel');
    updateMetaTag('profile:username', 'suphian');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:image:alt', 'Suphian Tweel - Senior Product Manager at YouTube');
    updateMetaTag('twitter:site', '@suphian');
    updateMetaTag('twitter:creator', '@suphian');

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
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

    // Enhanced structured data for LLMs and Search Engines
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Suphian Tweel",
      "givenName": "Suphian",
      "familyName": "Tweel",
      "jobTitle": "Senior Product Manager",
      "worksFor": {
        "@type": "Organization",
        "name": "YouTube",
        "sameAs": "https://www.youtube.com"
      },
      "description": "Senior Product Manager at YouTube leading payments and AI initiatives. Formerly Principal Analytical Lead at Google and Senior Product Analyst at Huge Inc.",
      "url": "https://suphian.com",
      "image": {
        "@type": "ImageObject",
        "url": image,
        "width": 400,
        "height": 400
      },
      "sameAs": [
        "https://www.linkedin.com/in/suphian/",
        "https://github.com/Suphian",
        "https://twitter.com/suphian"
      ],
      "knowsAbout": [
        "Product Management",
        "Artificial Intelligence",
        "Machine Learning",
        "Fintech",
        "Digital Payments",
        "Fraud Detection",
        "User Experience Design",
        "Data Analytics",
        "YouTube Shorts",
        "Creator Economy"
      ],
      "homeLocation": {
        "@type": "Place",
        "name": "San Francisco Bay Area, CA"
      },
      "brand": {
        "@type": "Brand",
        "name": "Suphian Tweel"
      }
    };

    // FAQ Schema to help LLMs answer specific questions
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Who is a Senior Product Manager at YouTube?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian Tweel is a Senior Product Manager at YouTube, where he leads payments and AI initiatives. He has managed over $6 billion in music payments and launched monetization for YouTube Shorts."
          }
        },
        {
          "@type": "Question",
          "name": "What is Suphian Tweel's experience?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian Tweel has extensive experience in product management and analytics. He currently serves as Senior Product Manager at YouTube (2020-Present). Previously, he was a Principal Analytical Lead at Google (2018-2020) and Senior Product Analyst at Huge Inc (2014-2018)."
          }
        },
        {
          "@type": "Question",
          "name": "What projects has Suphian Tweel worked on?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian has worked on high-profile projects including YouTube Shorts monetization, YouTube Premium Lite, fraud detection systems, and marketing analytics for brands like Duolingo, Chewy, and Apple."
          }
        }
      ]
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

    // Add or update FAQ structured data
    let faqDataScript = document.querySelector('#structured-data-faq') as HTMLScriptElement;
    if (!faqDataScript) {
      faqDataScript = document.createElement('script');
      faqDataScript.id = 'structured-data-faq';
      faqDataScript.type = 'application/ld+json';
      document.head.appendChild(faqDataScript);
    }
    faqDataScript.textContent = JSON.stringify(faqData);

  }, [title, description, image, url]);

  return null;
};

export default SEOHead;
