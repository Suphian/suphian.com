
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
          src="/lovable-uploads/d847628a-13e4-46ae-8c3c-b0892222a5b9.png" 
          alt="SUPH Logo" 
          className="h-[97px] md:h-[122px]"
        />
      </Link>
    </div>
  );
};

export default Logo;
