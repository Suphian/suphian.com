
import React from "react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <div className="absolute top-6 left-6 md:top-10 md:left-10">
      <Link to="/">
        <img 
          src="/lovable-uploads/e95f9219-fcb6-4a0e-bd75-7d6c2000fb1b.png" 
          alt="Suphian Logo" 
          className="h-[180px] md:h-[200px]"
        />
      </Link>
    </div>
  );
};

export default Logo;
