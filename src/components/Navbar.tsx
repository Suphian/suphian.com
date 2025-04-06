
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ButtonCustom } from "./ui/button-custom";
import { cn } from "@/lib/utils";
import ContactSheet from "./ContactSheet";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const location = useLocation();
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const isHomepage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [{
    name: "About",
    path: "/",
    scrollTo: "about-section"
  }, {
    name: "Leadership",
    path: "/",
    scrollTo: "leadership-section"
  }, {
    name: "Work",
    path: "/",
    scrollTo: "content-section"
  }, {
    name: "Press",
    path: "/contact"
  }];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (e: React.MouseEvent, scrollTo?: string) => {
    if (scrollTo && isHomepage) {
      e.preventDefault();
      closeMenu();
      const section = document.getElementById(scrollTo);
      if (section) {
        // Increased offset to prevent logo overlap with heading
        const offset = 190; // Adjusted from 185 to 190
        const topPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
          top: topPosition,
          behavior: "smooth"
        });
      }
    }
  };

  return <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4", isScrolled || isOpen ? "blur-backdrop border-b border-border/40" : "")}>
      <div className="container-custom">
        <nav className="flex justify-between items-center">
          
          {/* Logo or branding could go here */}
          <div className="flex-1"></div>

          {/* Desktop Navigation - moved to right */}
          <ul className="hidden md:flex space-x-8 items-center justify-end">
            {navLinks.map(link => <li key={link.name}>
                <Link to={link.path} className={cn("link-underline py-2 text-primary", isActive(link.path) && !link.scrollTo ? "font-medium" : "hover:text-primary/80")} onClick={e => handleNavClick(e, link.scrollTo)}>
                  {link.name}
                </Link>
              </li>)}
            <li>
              <button 
                onClick={() => setContactOpen(true)}
                className="wave-btn bg-primary text-background px-6 py-4 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group text-center"
              >
                <span className="relative z-10 group-hover:text-background transition-colors duration-300">Get in Touch</span>
                <span className="absolute inset-0 bg-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
              </button>
            </li>
          </ul>

          {/* Mobile Menu Button - moved to right */}
          <button className="md:hidden ml-auto flex items-center" onClick={toggleMenu} aria-label={isOpen ? "Close menu" : "Open menu"}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden absolute top-16 left-0 right-0 p-4 blur-backdrop border-b border-border/40 animate-fade-in">
            <ul className="flex flex-col space-y-4 py-4">
              {navLinks.map(link => <li key={link.name}>
                  <Link to={link.path} className={cn("block py-2 px-4 rounded-md transition-colors text-primary", isActive(link.path) && !link.scrollTo ? "font-medium bg-accent/10" : "hover:bg-accent/10 hover:text-primary/80")} onClick={e => handleNavClick(e, link.scrollTo)}>
                    {link.name}
                  </Link>
                </li>)}
              <li className="pt-2">
                <button 
                  className="w-full wave-btn bg-primary text-background px-6 py-4 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group text-center" 
                  onClick={() => {
                    setContactOpen(true);
                    closeMenu();
                  }}
                >
                  <span className="relative z-10 group-hover:text-background transition-colors duration-300">Get in Touch</span>
                  <span className="absolute inset-0 bg-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                </button>
              </li>
            </ul>
          </div>}
      </div>
      
      {/* Contact Sheet */}
      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </header>;
};

export default Navbar;
