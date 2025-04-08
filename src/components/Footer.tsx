
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

  return (
    <footer className="border-t border-border/60 bg-background py-12 md:py-16">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-6 md:mb-0">
            
          </div>
          
          <div className="flex space-x-4">
            <a href="mailto:suph.tweel@gmail.com" className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="Email">
              <Mail size={20} />
            </a>
            <a href="https://www.linkedin.com/in/suphian/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="https://github.com/Suphian" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="GitHub">
              <Github size={20} />
            </a>
            <button onClick={scrollToTop} className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="Scroll to top">
              <ArrowUp size={20} />
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
