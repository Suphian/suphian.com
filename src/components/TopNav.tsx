
import { useState, useEffect } from "react";
import { Home, Layers, Star, FileText, MailOpen } from "lucide-react";
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
  
  const navItems: NavItem[] = [
    {
      id: "about",
      icon: Home,
      label: "About",
      sectionId: "about-section"
    },
    {
      id: "leadership",
      icon: Layers,
      label: "Leadership",
      sectionId: "leadership-section"
    },
    {
      id: "work",
      icon: Star,
      label: "Work",
      sectionId: "content-section"
    },
    {
      id: "press",
      icon: FileText,
      label: "Press",
      path: "/contact",
    },
    {
      id: "contact",
      icon: MailOpen,
      label: "Contact",
      path: "#contact",
      sectionId: "contact-section",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      // Get all sections
      const sections = navItems
        .filter(item => item.sectionId)
        .map(item => {
          const element = document.getElementById(item.sectionId!);
          return { id: item.id, element };
        })
        .filter(item => item.element);
      
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
    if (item.sectionId) {
      const section = document.getElementById(item.sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(item.id);
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
                href={item.path || `#${item.sectionId}`}
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
