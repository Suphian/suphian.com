
import React from "react";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <div className="mt-12 flex gap-4">
      <Link 
        to="/projects" 
        className="wave-btn bg-youtubeRed text-primary px-6 py-3 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group"
      >
        <span className="relative z-10">Learn More</span>
        <span className="absolute inset-0 bg-gradient-to-r from-youtubeRed via-accent to-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
      </Link>
      <Link 
        to="/contact" 
        className="border border-primary/30 text-primary px-6 py-3 rounded-md font-montserrat font-bold hover:bg-primary/10 transition-all duration-300 relative overflow-hidden group"
      >
        <span className="relative z-10">Contact Me</span>
        <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
      </Link>
    </div>
  );
};

export default CallToAction;
