import React, { useState, useEffect, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { useContactSheet } from "@/features/contact/context/ContactSheetContext";

const LazyLiveAnalyticsPanel = React.lazy(() => import("@/shared/components/common/LiveAnalyticsPanel"));

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const location = useLocation();
  const { openContactSheet } = useContactSheet();
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

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

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
      name: "Projects",
      path: "/",
      scrollTo: "projects-section"
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

    openContactSheet("Navbar");
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
        <nav className="flex justify-between items-center" aria-label="Main navigation">
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
                onClick={() => setAnalyticsOpen(true)}
                className="text-xs font-mono px-3 py-2 hover:opacity-70 transition-opacity flex items-center gap-1.5"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                aria-label="View live analytics activity"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Activity</span>
              </button>
            </li>

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

          <button
            type="button"
            className="md:hidden p-2 -mr-2 hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label="Menu"
            onClick={() => setIsOpen(prev => !prev)}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {isOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </nav>

        {isOpen && (
          <ul id="mobile-menu" className="md:hidden mt-4 mb-2 flex flex-col items-end gap-1 bg-black/95 backdrop-blur-md border border-white/10 rounded-md px-4 py-3">
            {navLinks.map(link => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="block text-xs font-mono py-3 px-2 hover:opacity-70 transition-opacity"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                  onClick={e => handleNavClick(e, link.scrollTo)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  closeMenu();
                  setAnalyticsOpen(true);
                }}
                className="text-xs font-mono py-3 px-2 hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
              >
                Activity
              </button>
            </li>
            <li className="mt-1">
              <button
                onClick={() => {
                  closeMenu();
                  handleGetInTouchClick();
                }}
                className="text-xs font-mono px-4 py-2 border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
                style={{ color: 'rgba(255, 255, 255, 0.85)' }}
              >
                Contact
              </button>
            </li>
          </ul>
        )}
      </div>

      <Suspense fallback={null}>
        {analyticsOpen && (
          <LazyLiveAnalyticsPanel isOpen={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
        )}
      </Suspense>
    </header>
  );
};

export default Navbar;
