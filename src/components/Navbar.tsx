import React, { useState, useEffect, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WaveButton } from "@/components/ui/wave-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const LazyContactSheet = React.lazy(() => import("./ContactSheet"));

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const closeMenu = () => setIsOpen(false);
  const isHomepage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setIsScrolled(window.scrollY > 10);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    
    await import("./ContactSheet");
    setContactOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAuthClick = () => {
    if (isAuthPage) {
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4", 
      isScrolled || isOpen ? "blur-backdrop border-b border-border/40" : ""
    )}>
      <div className="container-custom">
        <nav className="flex justify-between items-center">
          <div className="flex-1"></div>

          <ul className="hidden md:flex space-x-4 items-center justify-end">
            {!isAuthPage && navLinks.map(link => (
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
            
            {user ? (
              <>
                {isAdmin && (
                  <li>
                    <Button variant="outline" size="sm" onClick={handleAdminClick}>
                      Admin
                    </Button>
                  </li>
                )}
                <li>
                  <WaveButton 
                    variant="primary"
                    onClick={handleGetInTouchClick}
                  >
                    Get in Touch
                  </WaveButton>
                </li>
                <li>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </li>
              </>
            ) : (
              <>
                {!isAuthPage && (
                  <li>
                    <WaveButton 
                      variant="primary"
                      onClick={handleGetInTouchClick}
                    >
                      Get in Touch
                    </WaveButton>
                  </li>
                )}
                <li>
                  <Button variant="outline" size="sm" onClick={handleAuthClick}>
                    {isAuthPage ? 'Back to Home' : 'Sign In'}
                  </Button>
                </li>
              </>
            )}
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
