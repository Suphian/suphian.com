import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WaveButton } from "@/components/ui/wave-button";
import ContactSheet from "./ContactSheet";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setIsOpen(false);
  const isHomepage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    {
      name: "About",
      path: "/",
      scrollTo: "about-section"
    },
    {
      name: "Work",
      path: "/",
      scrollTo: "experience-section"
    },
    {
      name: "Analytics",
      path: "/analytics"
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = async (e: React.MouseEvent, scrollTo?: string) => {
    console.log("🎯 Nav link clicked:", scrollTo || "regular navigation");
    
    if (scrollTo && isHomepage) {
      e.preventDefault();
      closeMenu();
      
      try {
        await window.trackEvent?.("nav_click", {
          label: scrollTo,
          page: window.location.pathname,
          source: "Navbar",
          type: "scroll_to_section",
        });
        console.log(`✅ Navigation to ${scrollTo} tracked successfully`);
      } catch (error) {
        console.error("❌ Failed to track navigation event:", error);
      }
      
      const section = document.getElementById(scrollTo);
      if (section) {
        const offset = 190;
        const topPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
          top: topPosition,
          behavior: "smooth"
        });
      }
    }
  };

  const handleGetInTouchClick = async () => {
    console.log("🎯 Button clicked: Get in Touch (Navbar)");
    
    try {
      await window.trackEvent?.("nav_cta_click", {
        label: "Get in Touch",
        page: window.location.pathname,
        source: "Navbar",
        type: "contact_button",
      });
      console.log("✅ Navbar Get in Touch event tracked successfully");
    } catch (error) {
      console.error("❌ Failed to track navbar contact event:", error);
    }
    
    setContactOpen(true);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4", 
      isScrolled || isOpen ? "blur-backdrop border-b border-border/40" : ""
    )}>
      <div className="container-custom">
        <nav className="flex justify-between items-center">
          <div className="flex-1"></div>

          <ul className="hidden md:flex space-x-8 items-center justify-end">
            {navLinks.map(link => (
              <li key={link.name}>
                <Link 
                  to={link.path} 
                  className={cn(
                    "link-underline py-2 text-primary", 
                    isActive(link.path) && !link.scrollTo ? "font-medium" : "hover:text-primary/80"
                  )} 
                  onClick={e => handleNavClick(e, link.scrollTo)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            
            <li>
              <WaveButton 
                variant="primary"
                onClick={handleGetInTouchClick}
              >
                Get in Touch
              </WaveButton>
            </li>
          </ul>
        </nav>
      </div>
      
      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </header>
  );
};

export default Navbar;
