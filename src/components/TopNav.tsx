
import { useState, useEffect } from "react";
import { Home, MapPin, MailOpen, Layers } from "lucide-react";
import { useLocation } from "react-router-dom";

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  sectionId?: string;
}

const TopNav = () => {
  const [activeSection, setActiveSection] = useState<string>("home");
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAboutPage = location.pathname === "/about";
  const isContactPage = location.pathname === "/contact";
  
  const navItems: NavItem[] = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      path: "/",
    },
    {
      id: "about",
      icon: MapPin,
      label: "About",
      path: isAboutPage ? undefined : "/about",
      sectionId: isAboutPage ? "about-section" : undefined,
    },
    {
      id: "contact",
      icon: MailOpen,
      label: "Contact",
      path: isContactPage ? undefined : "/contact",
      sectionId: isContactPage ? "contact-section" : undefined,
    },
    {
      id: "leadership",
      icon: Layers,
      label: "Leadership",
      path: isAboutPage ? undefined : "/about#leadership-section",
      sectionId: isAboutPage ? "leadership-section" : undefined,
    },
  ];

  useEffect(() => {
    if (isHomePage) {
      setActiveSection("home");
    } else if (isAboutPage) {
      setActiveSection("about");
    } else if (isContactPage) {
      setActiveSection("contact");
    }
  }, [isHomePage, isAboutPage, isContactPage]);

  const handleClick = (item: NavItem) => {
    if (item.sectionId) {
      const section = document.getElementById(item.sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };
  
  return (
    <nav className="fixed top-20 left-0 right-0 z-40 blur-backdrop border-b border-border/40 py-2">
      <div className="container-custom">
        <ul className="flex justify-center space-x-8 md:space-x-16">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={item.path}
                onClick={(e) => {
                  if (item.sectionId) {
                    e.preventDefault();
                    handleClick(item);
                  }
                }}
                className={`flex flex-col items-center px-4 py-2 rounded-md transition-all duration-300 ${
                  activeSection === item.id ? "text-accent" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
                <span 
                  className={`mt-1 block h-1 w-5 rounded-full transition-all duration-300 ${
                    activeSection === item.id ? "bg-accent" : "bg-transparent"
                  }`}
                ></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default TopNav;
