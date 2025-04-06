
import { useState, useEffect } from "react";
import { Home, Layers, Star, FileText, MailOpen } from "lucide-react";
import { useLocation } from "react-router-dom";
import ContactSheet from "./ContactSheet";

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  sectionId?: string;
  action?: () => void;
}

const TopNav = () => {
  const [activeSection, setActiveSection] = useState<string>("home");
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [contactOpen, setContactOpen] = useState(false);

  const navItems: NavItem[] = [{
    id: "about",
    icon: Home,
    label: "About",
    sectionId: "about-section"
  }, {
    id: "leadership",
    icon: Layers,
    label: "Leadership",
    sectionId: "leadership-section"
  }, {
    id: "work",
    icon: Star,
    label: "Work",
    sectionId: "content-section"
  }, {
    id: "press",
    icon: FileText,
    label: "Press",
    path: "/contact"
  }, {
    id: "contact",
    icon: MailOpen,
    label: "Get in Touch",
    action: () => setContactOpen(true)
  }];

  // Listen for custom event from the Start Here button
  useEffect(() => {
    const handleStartButtonClick = () => {
      setIsVisible(true);
    };
    
    window.addEventListener('startButtonClicked', handleStartButtonClick);
    return () => {
      window.removeEventListener('startButtonClicked', handleStartButtonClick);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled beyond the initial viewport
      if (window.scrollY > window.innerHeight * 0.5) {
        setIsVisible(true);
      }
      
      // Get all sections
      const sections = navItems.filter(item => item.sectionId).map(item => {
        const element = document.getElementById(item.sectionId!);
        return {
          id: item.id,
          element
        };
      }).filter(item => item.element);
      if (sections.length === 0) return;

      // Find the section that is currently in view
      const scrollPosition = window.scrollY + 100; // Add some offset

      for (const section of sections) {
        if (!section.element) continue;
        const sectionTop = section.element.offsetTop;
        const sectionHeight = section.element.offsetHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(section.id);
          break;
        }
      }
    };
    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage, navItems]);

  const handleClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else if (item.sectionId) {
      const section = document.getElementById(item.sectionId);
      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        setActiveSection(item.id);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <nav className="fixed top-20 left-0 right-0 z-40 blur-backdrop border-b border-border/40 py-2">
        <div className="container-custom text-primary">
          <ul className="flex justify-center space-x-8">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleClick(item)}
                  className={`flex items-center px-3 py-2 text-sm transition-colors hover:text-primary/80 ${
                    activeSection === item.id ? "font-medium" : ""
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      <ContactSheet open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default TopNav;
