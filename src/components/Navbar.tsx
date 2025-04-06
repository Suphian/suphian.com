
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
    name: "Work",
    path: "/",
    scrollTo: "experience-section"
  }];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (e: React.MouseEvent, scrollTo?: string) => {
    if (scrollTo && isHomepage) {
      e.preventDefault();
      closeMenu();
      const section = document.getElementById(scrollTo);
      if (section) {
        // Increased offset to prevent logo overlap with heading
        const offset = 190;
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

          {/* Desktop Navigation only */}
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

          {/* No mobile menu button at all */}
        </nav>
      </div>
      
      {/* Contact Sheet */}
      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </header>;
};

export default Navbar;
