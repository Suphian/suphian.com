
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Logo = () => {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Only show the logo on the homepage/landing page
  if (!isHomepage) return null;

  return (
    <div className="fixed top-6 left-6 md:top-10 md:left-10 z-50">
      <Link to="/" onClick={handleLogoClick}>
        <img 
          src="/lovable-uploads/8edd0658-a313-4e0a-953c-1f12e87a1592.png" 
          alt="Suphian Tweel - Product Manager at YouTube, professional headshot and logo" 
          className="h-[97px] md:h-[122px] hover:scale-105 transition-transform duration-200"
          loading="eager"
          decoding="async"
          width="122"
          height="122"
        />
      </Link>
    </div>
  );
};

export default Logo;
