import React, { useState, Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const LazyContactSheet = React.lazy(() => import("./ContactSheet"));

const Footer = () => {
  const [contactOpen, setContactOpen] = useState(false);
  const isMobile = useIsMobile();
  

  const handleSocialClick = async (platform: string, url: string) => {
    
    try {
      await window.trackEvent?.("footer_social_click", {
        label: platform,
        url: url,
        page: window.location.pathname,
        source: "Footer",
        type: "external_link",
      });
    } catch (error) {
      console.error(`❌ Failed to track ${platform} click:`, error);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-black py-16 md:py-20 relative z-10">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          {/* Minimal footer - document end state */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Copyright */}
            <div>
              <p 
                className="text-xs font-mono"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                © {new Date().getFullYear()} Suphian Tweel
              </p>
            </div>
            
            {/* Minimal social links */}
            <nav className="flex items-center gap-3 flex-wrap" aria-label="Social links">
              <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=suph.tweel@gmail.com&su=Hey,%20wanted%20to%20chat" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-mono hover:opacity-70 transition-opacity whitespace-nowrap"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                aria-label="Email"
                onClick={() => handleSocialClick("Email", "mailto:suph.tweel@gmail.com")}
              >
                Email
              </a>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
              <a 
                href="https://www.linkedin.com/in/suphian/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-mono hover:opacity-70 transition-opacity whitespace-nowrap"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                aria-label="LinkedIn"
                onClick={() => handleSocialClick("LinkedIn", "https://www.linkedin.com/in/suphian/")}
              >
                LinkedIn
              </a>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>·</span>
              <a 
                href="https://github.com/Suphian" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-mono hover:opacity-70 transition-opacity whitespace-nowrap"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                aria-label="GitHub"
                onClick={() => handleSocialClick("GitHub", "https://github.com/Suphian")}
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
        
        {/* Contact Sheet */}
        <Suspense fallback={null}>
          <LazyContactSheet open={contactOpen} onOpenChange={setContactOpen} />
        </Suspense>
      </div>
    </footer>
  );
};

export default Footer;
