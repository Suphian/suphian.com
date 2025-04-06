
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Logo = () => {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  // Only show the logo on the homepage/landing page
  if (!isHomepage) return null;

  return (
    <div className="fixed top-6 left-6 md:top-10 md:left-10 z-50">
      <Link to="/">
        <img 
          src="/lovable-uploads/8edd0658-a313-4e0a-953c-1f12e87a1592.png" 
          alt="Suphian Logo" 
          className="h-[150px] md:h-[180px]"
        />
      </Link>
    </div>
  );
};

export default Logo;
