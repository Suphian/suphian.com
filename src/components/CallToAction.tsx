
import React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const CallToAction = () => {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  const scrollToProjects = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault();
      const projectsSection = document.getElementById("projects-section");
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="mt-12 flex gap-4">
      <Link 
        to="/projects" 
        onClick={scrollToProjects}
        className="wave-btn bg-youtubeRed text-primary px-6 py-3 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group"
      >
        <span className="relative z-10 group-hover:text-black transition-colors duration-300">Learn More</span>
        <span className="absolute inset-0 bg-primary bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
      </Link>
      <Link 
        to="/contact" 
        className="border border-primary/30 text-primary px-6 py-3 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group"
      >
        <span className="relative z-10 group-hover:text-black transition-colors duration-300">Contact Me</span>
        <span className="absolute inset-0 bg-primary bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
      </Link>
    </div>
  );
};

export default CallToAction;
