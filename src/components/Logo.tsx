
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Logo = () => {
  const location = useLocation();
  const isHomepage = location.pathname === "/";
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    if (!isHomepage) {
      setShowLogo(true);
      return;
    }

    let ticking = false;
    const update = () => {
      // On homepage, only show logo after scrolling past landing section
      setShowLogo(window.scrollY > window.innerHeight * 0.5);
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

  const handleLogoClick = (e: React.MouseEvent) => {
    // If we're already on the homepage, prevent navigation and just scroll to top
    if (isHomepage) {
      e.preventDefault();
    }
    
    // Always scroll to top when logo is clicked
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Always show logo (removed conditional visibility for now)
  // TODO: Consider restoring conditional visibility if needed: if (isHomepage && !showLogo) return null;

  // Switch between logos by changing the src below:
  // Option 1: Logo.webp
  // Option 2: 01f5ac94-7fd7-4f93-a2b8-06b0e5fec8f3.png
  const logoPath = "/assets/logos/Logo.webp";

  return (
    <div className="fixed top-6 left-6 md:top-10 md:left-10 z-[100]">
      <Link to="/" onClick={handleLogoClick}>
        <img 
          src={logoPath}
          alt="Suphian Tweel - Product Manager at YouTube" 
          className="h-[116px] md:h-[146px] w-auto hover:scale-105 transition-transform duration-200"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </Link>
    </div>
  );
};

export default Logo;
