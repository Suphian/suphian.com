
import React from "react";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <div className="mt-12 flex gap-4">
      <Link 
        to="/projects" 
        className="bg-youtubeRed text-primary px-6 py-3 rounded-md font-montserrat font-bold hover:bg-opacity-90 transition-all duration-300"
      >
        View My Work
      </Link>
      <Link 
        to="/contact" 
        className="border border-primary/30 text-primary px-6 py-3 rounded-md font-montserrat font-bold hover:bg-primary/10 transition-all duration-300"
      >
        Contact Me
      </Link>
    </div>
  );
};

export default CallToAction;
