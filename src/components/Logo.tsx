
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
          src="https://raw.githubusercontent.com/Suphian/SQL-exercise/e11fa79c1e21d3296c106e8b26dc470ce5e56f24/u1327668621_logo_SUPH_--chaos_15_--ar_23_--profile_aa8enny_--st_b2040bf7-71f1-4263-bf3e-422f9561d81e%20(1).png" 
          alt="Suphian Logo" 
          className="h-[97px] md:h-[122px]"
        />
      </Link>
    </div>
  );
};

export default Logo;
