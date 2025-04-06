
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

  const navLinks = [
    { name: "About", path: "/", scrollTo: "about-section" },
    { name: "Leadership", path: "/", scrollTo: "leadership-section" },
    { name: "Work", path: "/", scrollTo: "content-section" },
    { name: "Press", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (e: React.MouseEvent, scrollTo?: string) => {
    if (scrollTo && isHomepage) {
      e.preventDefault();
      closeMenu();
      const section = document.getElementById(scrollTo);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4",
        isScrolled || isOpen ? "blur-backdrop border-b border-border/40" : ""
      )}
    >
      <div className="container-custom">
        <nav className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold" onClick={closeMenu}>
            Suphian Tweel
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={cn(
                    "link-underline py-2",
                    isActive(link.path) && !link.scrollTo
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={(e) => handleNavClick(e, link.scrollTo)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            <li>
              <ButtonCustom size="sm" arrowIcon onClick={() => setContactOpen(true)}>
                Contact Me
              </ButtonCustom>
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center"
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 p-4 blur-backdrop border-b border-border/40 animate-fade-in">
            <ul className="flex flex-col space-y-4 py-4">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={cn(
                      "block py-2 px-4 rounded-md transition-colors",
                      isActive(link.path) && !link.scrollTo
                        ? "font-medium bg-accent/10 text-foreground"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                    )}
                    onClick={(e) => handleNavClick(e, link.scrollTo)}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <ButtonCustom className="w-full" arrowIcon onClick={() => {
                  setContactOpen(true);
                  closeMenu();
                }}>
                  Contact Me
                </ButtonCustom>
              </li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Contact Sheet */}
      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </header>
  );
};

export default Navbar;
