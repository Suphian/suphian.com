import { Link } from "react-router-dom";
import { Mail, Linkedin, Github, ArrowUp } from "lucide-react";
const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  return <footer className="border-t border-border/60 bg-background py-12 md:py-16">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-6 md:mb-0">
            
            
          </div>
          
          <div className="flex space-x-4">
            <a href="mailto:suph.tweel@gmail.com" className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="Email">
              <Mail size={20} />
            </a>
            <a href="https://www.linkedin.com/in/suphian/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="https://github.com/Suphian" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="GitHub">
              <Github size={20} />
            </a>
            <button onClick={scrollToTop} className="p-2 rounded-full bg-secondary hover:bg-secondary/70 transition-colors" aria-label="Scroll to top">
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/40">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Suphian Tweel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;