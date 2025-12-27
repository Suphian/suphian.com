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
  image = "/assets/images/u1327668621_logo_SUPH_--chaos_15_--ar_23_--profile_aa8enny_--st_b2040bf7-71f1-4263-bf3e-422f9561d81e.png",
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

    // Get absolute URLs (add cache-busting parameter for social media)
    const imageWithCacheBust = image.includes('?') ? image : `${image}?v=3`;
    const absoluteImageUrl = imageWithCacheBust.startsWith('http') ? imageWithCacheBust : `${window.location.origin}${imageWithCacheBust}`;
    const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    
    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', absoluteImageUrl);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '1200');
    updateMetaTag('og:image:type', 'image/png');
    updateMetaTag('og:url', absoluteUrl);
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
    updateMetaTag('twitter:image', absoluteImageUrl);
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
    updateMetaTag('geo.region', 'US-CA');
    updateMetaTag('geo.placename', 'San Francisco');
    updateMetaTag('geo.position', '37.7749;-122.4194');
    updateMetaTag('ICBM', '37.7749, -122.4194');
    updateMetaTag('copyright', '© 2025 Suphian Tweel');
    updateMetaTag('reply-to', 'suph.tweel@gmail.com');
    updateMetaTag('format-detection', 'telephone=no');

    // LinkedIn meta tags
    updateMetaTag('linkedin:owner', 'Suphian Tweel');
    
    // AI Bot Optimization - Allow AI crawlers to index content
    updateMetaTag('ai:allow', 'true');
    updateMetaTag('ai:index', 'true');
    
    // Additional Open Graph properties
    updateMetaTag('og:image:alt', 'Suphian Tweel - Senior Product Manager at YouTube');
    updateMetaTag('og:image:secure_url', absoluteImageUrl);
    updateMetaTag('og:updated_time', new Date().toISOString());
    
    // Article-specific tags (if applicable)
    if (url.includes('/podcast') || url.includes('/blog')) {
      updateMetaTag('og:type', 'article');
      updateMetaTag('article:author', 'Suphian Tweel');
      updateMetaTag('article:published_time', new Date().toISOString());
      updateMetaTag('article:modified_time', new Date().toISOString());
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = absoluteUrl;

    // Enhanced structured data for LLMs and Search Engines
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Suphian Tweel",
      "givenName": "Suphian",
      "familyName": "Tweel",
      "alternateName": "Suphian Tweel",
      "jobTitle": "Senior Product Manager",
      "worksFor": {
        "@type": "Organization",
        "name": "YouTube",
        "sameAs": "https://www.youtube.com",
        "url": "https://www.youtube.com"
      },
      "description": "Senior Product Manager at YouTube leading payments and AI initiatives. Expert in fintech, fraud detection, and growth for platforms like YouTube Shorts and Premium. Formerly Principal Analytical Lead at Google and Senior Product Analyst at Huge Inc.",
      "url": absoluteUrl,
      "image": {
        "@type": "ImageObject",
        "url": absoluteImageUrl,
        "width": 1200,
        "height": 1200,
        "caption": "Suphian Tweel - Senior Product Manager at YouTube"
      },
      "email": "suph.tweel@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "San Francisco",
        "addressRegion": "CA",
        "addressCountry": "US"
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
        "Creator Economy",
        "Growth Strategy",
        "Monetization",
        "Platform Development"
      ],
      "homeLocation": {
        "@type": "Place",
        "name": "San Francisco Bay Area, CA",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "San Francisco",
          "addressRegion": "CA",
          "addressCountry": "US"
        }
      },
      "brand": {
        "@type": "Brand",
        "name": "Suphian Tweel"
      },
      "alumniOf": [
        {
          "@type": "Organization",
          "name": "Google"
        }
      ],
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Senior Product Manager",
        "occupationLocation": {
          "@type": "City",
          "name": "San Francisco"
        },
        "skills": [
          "Product Strategy",
          "Data Analytics",
          "AI/ML",
          "Fintech",
          "Payments",
          "Fraud Detection"
        ]
      }
    };

    // FAQ Schema to help LLMs answer specific questions
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Who is Suphian Tweel?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian Tweel is a Senior Product Manager at YouTube, where he leads payments and AI initiatives. He has managed over $6 billion in music payments and launched monetization for YouTube Shorts. He is an expert in fintech, fraud detection, and growth for platforms like YouTube Shorts and Premium."
          }
        },
        {
          "@type": "Question",
          "name": "What is Suphian Tweel's professional experience?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian Tweel has extensive experience in product management and analytics. He currently serves as Senior Product Manager at YouTube (2020-Present), where he leads payments and AI initiatives. Previously, he was a Principal Analytical Lead at Google (2018-2020) and Senior Product Analyst at Huge Inc (2014-2018)."
          }
        },
        {
          "@type": "Question",
          "name": "What projects has Suphian Tweel worked on?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian has worked on high-profile projects including YouTube Shorts monetization, YouTube Premium Lite, fraud detection systems, and marketing analytics for brands like Duolingo, Chewy, and Apple. He has managed over $6 billion in music payments and launched key monetization features for YouTube."
          }
        },
        {
          "@type": "Question",
          "name": "What are Suphian Tweel's areas of expertise?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian Tweel specializes in Product Management, Artificial Intelligence, Machine Learning, Fintech, Digital Payments, Fraud Detection, User Experience Design, Data Analytics, YouTube Shorts, Creator Economy, Growth Strategy, Monetization, and Platform Development."
          }
        },
        {
          "@type": "Question",
          "name": "Where is Suphian Tweel located?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Suphian Tweel is based in San Francisco, California, where he works as a Senior Product Manager at YouTube."
          }
        },
        {
          "@type": "Question",
          "name": "How can I contact Suphian Tweel?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can reach Suphian Tweel via email at suph.tweel@gmail.com, or connect with him on LinkedIn at linkedin.com/in/suphian, GitHub at github.com/Suphian, or Twitter at twitter.com/suphian."
          }
        }
      ]
    };

    // WebSite structured data for better search engine understanding
    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Suphian Tweel Portfolio",
      "url": window.location.origin,
      "description": "Portfolio website of Suphian Tweel, Senior Product Manager at YouTube. Showcasing experience in product management, AI, fintech, and payments.",
      "author": {
        "@type": "Person",
        "name": "Suphian Tweel"
      },
      "publisher": {
        "@type": "Person",
        "name": "Suphian Tweel"
      },
      "inLanguage": "en-US",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${window.location.origin}/?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    // Organization structured data
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Suphian Tweel",
      "url": window.location.origin,
      "logo": absoluteImageUrl,
      "sameAs": [
        "https://www.linkedin.com/in/suphian/",
        "https://github.com/Suphian",
        "https://twitter.com/suphian"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "suph.tweel@gmail.com",
        "contactType": "Professional"
      }
    };

    // BreadcrumbList for navigation structure
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        }
      ]
    };

    // Add page-specific breadcrumb items
    if (url.includes('/podcast')) {
      breadcrumbData.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": "Podcast",
        "item": absoluteUrl
      });
    } else if (url.includes('/customers')) {
      breadcrumbData.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": "Customers",
        "item": absoluteUrl
      });
    }

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

    // Add or update WebSite structured data
    let websiteDataScript = document.querySelector('#structured-data-website') as HTMLScriptElement;
    if (!websiteDataScript) {
      websiteDataScript = document.createElement('script');
      websiteDataScript.id = 'structured-data-website';
      websiteDataScript.type = 'application/ld+json';
      document.head.appendChild(websiteDataScript);
    }
    websiteDataScript.textContent = JSON.stringify(websiteData);

    // Add or update Organization structured data
    let organizationDataScript = document.querySelector('#structured-data-organization') as HTMLScriptElement;
    if (!organizationDataScript) {
      organizationDataScript = document.createElement('script');
      organizationDataScript.id = 'structured-data-organization';
      organizationDataScript.type = 'application/ld+json';
      document.head.appendChild(organizationDataScript);
    }
    organizationDataScript.textContent = JSON.stringify(organizationData);

    // Add or update BreadcrumbList structured data
    let breadcrumbDataScript = document.querySelector('#structured-data-breadcrumb') as HTMLScriptElement;
    if (!breadcrumbDataScript) {
      breadcrumbDataScript = document.createElement('script');
      breadcrumbDataScript.id = 'structured-data-breadcrumb';
      breadcrumbDataScript.type = 'application/ld+json';
      document.head.appendChild(breadcrumbDataScript);
    }
    breadcrumbDataScript.textContent = JSON.stringify(breadcrumbData);

  }, [title, description, image, url]);

  return null;
};

export default SEOHead;
