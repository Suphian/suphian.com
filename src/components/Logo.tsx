
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
        <div 
          className="logo-suph hover:scale-105 transition-transform duration-200"
          style={{ fontSize: 'min(12vw, 8rem)' }}
        >
          SUPH
        </div>
      </Link>
    </div>
  );
};

export default Logo;
