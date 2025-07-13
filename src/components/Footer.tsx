
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Linkedin, Github, ArrowUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactSheet from "./ContactSheet";

const Footer = () => {
  const [contactOpen, setContactOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleSocialClick = async (platform: string, url: string) => {
    console.log(`🎯 Footer link clicked: ${platform}`);
    
    try {
      await window.trackEvent?.("footer_social_click", {
        label: platform,
        url: url,
        page: window.location.pathname,
        source: "Footer",
        type: "external_link",
      });
      console.log(`✅ Footer ${platform} click tracked successfully`);
    } catch (error) {
      console.error(`❌ Failed to track ${platform} click:`, error);
    }
  };

  return (
    <footer className="border-t border-border/60 bg-background py-12 md:py-16">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-6 md:mb-0">
            
          </div>
          
          <div className="flex space-x-4">
            <a 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=suph.tweel@gmail.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" 
              aria-label="Email"
              onClick={() => handleSocialClick("Email", "mailto:suph.tweel@gmail.com")}
            >
              <Mail size={20} />
            </a>
            <a 
              href="https://www.linkedin.com/in/suphian/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" 
              aria-label="LinkedIn"
              onClick={() => handleSocialClick("LinkedIn", "https://www.linkedin.com/in/suphian/")}
            >
              <Linkedin size={20} />
            </a>
            <a 
              href="https://github.com/Suphian" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" 
              aria-label="GitHub"
              onClick={() => handleSocialClick("GitHub", "https://github.com/Suphian")}
            >
              <Github size={20} />
            </a>
            <a 
              href="https://blog.youtube/creator-and-artist-stories/6-billion-paid-to-the-music-industry-in-12-months/#:~:text=In%20the%2012%20months%20between,B%20to%20the%20music%20industry.&text=Last%20year%20we%20announced%20a,B%20to%20the%20music%20industry." 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" 
              aria-label="YouTube"
              onClick={() => handleSocialClick("YouTube", "https://blog.youtube/creator-and-artist-stories/6-billion-paid-to-the-music-industry-in-12-months/")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <button 
              onClick={scrollToTop} 
              className="wave-btn p-2 rounded-full bg-primary text-background hover:text-primary-foreground font-montserrat font-bold transition-all duration-300 relative overflow-hidden group" 
              aria-label="Scroll to top"
            >
              <span className="relative z-10 transition-colors duration-300">
                <ArrowUp size={20} />
              </span>
              <span className="absolute inset-0 bg-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
            </button>
          </div>
        </div>
        
        {/* Mobile Contact Button */}
        {isMobile && (
          <div className="mt-8 pb-4">
            <button 
              onClick={() => setContactOpen(true)}
              className="w-full wave-btn bg-primary text-background px-6 py-4 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group text-center"
            >
              <span className="relative z-10 group-hover:text-background transition-colors duration-300">Get in Touch</span>
              <span className="absolute inset-0 bg-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
            </button>
          </div>
        )}
        
        {/* Contact Sheet */}
        <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
      </div>
    </footer>
  );
};

export default Footer;
