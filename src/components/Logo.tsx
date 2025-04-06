
import React from "react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <div className="fixed top-6 left-6 md:top-10 md:left-10 z-50">
      <Link to="/">
        <img 
          src="/lovable-uploads/e95f9219-fcb6-4a0e-bd75-7d6c2000fb1b.png" 
          alt="Suphian Logo" 
          className="h-[120px] md:h-[140px]"
        />
      </Link>
    </div>
  );
};

export default Logo;
