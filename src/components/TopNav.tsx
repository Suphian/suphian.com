
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
    label: "Contact",
    path: "#contact",
    sectionId: "contact-section"
  }];

  useEffect(() => {
    const handleScroll = () => {
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
    if (item.sectionId) {
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

  return <nav className="fixed top-20 left-0 right-0 z-40 blur-backdrop border-b border-border/40 py-2">
      <div className="container-custom">
        {/* Content could be added here if needed in the future */}
      </div>
    </nav>;
};

export default TopNav;
