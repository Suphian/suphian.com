import React, { useState, useEffect, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

const LazyContactSheet = React.lazy(() => import("@/features/contact/components/ContactSheet"));

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const location = useLocation();
  const closeMenu = () => setIsOpen(false);
  const isHomepage = location.pathname === "/";

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);
      // On homepage, only show navbar after scrolling past landing section
      if (isHomepage) {
        setShowNavbar(scrollY > window.innerHeight * 0.5);
      } else {
        setShowNavbar(true);
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    // Initial check
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomepage]);

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
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = async (e: React.MouseEvent, scrollTo?: string) => {
    
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
      } catch (error) {
        console.error("❌ Failed to track navigation event:", error);
      }
      
      const section = document.getElementById(scrollTo);
      if (section) {
        // Use scrollIntoView to avoid forced reflow from getBoundingClientRect
        section.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        // Adjust for navbar offset using CSS scroll-margin-top instead
      }
    }
  };

  const handleGetInTouchClick = async () => {
    
    try {
      await window.trackEvent?.("nav_cta_click", {
        label: "Get in Touch",
        page: window.location.pathname,
        source: "Navbar",
        type: "contact_button",
      });
    } catch (error) {
      console.error("❌ Failed to track navbar contact event:", error);
    }
    
    await import("@/features/contact/components/ContactSheet");
    setContactOpen(true);
  };

  // Hide navbar on homepage until user scrolls
  if (isHomepage && !showNavbar) {
    return null;
  }

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4", 
      isScrolled || isOpen ? "blur-backdrop" : ""
    )}>
      <div className="container-custom">
        <nav className="flex justify-between items-center">
          <div className="flex-1"></div>

          <ul className="hidden md:flex space-x-6 md:space-x-8 items-center justify-end">
            {navLinks.map(link => (
              <li key={link.name}>
                <Link 
                  to={link.path} 
                  className={cn(
                    "text-xs font-mono py-2 hover:opacity-70 transition-opacity", 
                    isActive(link.path) && !link.scrollTo ? "opacity-100" : "opacity-80"
                  )}
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                  onClick={e => handleNavClick(e, link.scrollTo)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            
            <li>
              <button
                onClick={handleGetInTouchClick}
                className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
              >
                Contact
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      <Suspense fallback={null}>
        <LazyContactSheet open={contactOpen} onOpenChange={setContactOpen} />
      </Suspense>
    </header>
  );
};

export default Navbar;
