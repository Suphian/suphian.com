
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Logo = () => {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

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
