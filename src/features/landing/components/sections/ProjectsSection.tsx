import { forwardRef, useCallback, memo } from "react";
import { ExternalLink } from "lucide-react";

const ProjectsSection = memo(forwardRef<HTMLDivElement>((_props, ref) => {
  const handleExternalLinkClick = useCallback(async (linkTitle: string, url: string) => {
    try {
      await window.trackEvent?.("external_link_click", {
        label: linkTitle,
        url: url,
        page: window.location.pathname,
        source: "ProjectsSection",
        type: "external_link",
      });
    } catch (error) {
      console.error(`❌ Failed to track external link "${linkTitle}" click:`, error);
    }
  }, []);

  const project = {
    tagline: "Operating system for Merchant Cash Advance",
    name: "Abacus Labs",
    description: "Abacus turns spreadsheet chaos into a real-time command center for MCA operators — deals, underwriting, collections, syndication, and compliance in one place. I lead product and engineering.",
    stack: ["React", "Next.js", "Postgres", "Supabase", "Claude AI", "Plaid"],
    links: [{
      url: "https://abacuslabs.co",
      title: "Visit abacuslabs.co",
    }, {
      url: "https://github.com/Suphian/abacus",
      title: "View on GitHub",
    }],
  };

  return (
    <section id="projects-section" ref={ref} className="mb-32 md:mb-40 py-12" aria-labelledby="projects-heading">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <h2 id="projects-heading" className="heading-lg mb-16 text-white" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            PROJECTS
          </h2>

          <div className="relative">
            <div className="flex gap-6 md:gap-8">
              {/* Timeline dot — matches Experience section */}
              <div className="flex-shrink-0 relative z-10" aria-hidden="true">
                <div
                  className="w-3 h-3 rounded-full bg-white/20 border border-white/30"
                  style={{ marginTop: '0.25rem' }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                {/* Tagline */}
                <div
                  className="text-sm font-mono mb-2"
                  style={{ color: 'rgba(220, 70, 55, 1)' }}
                >
                  {project.tagline}
                </div>

                {/* Name */}
                <h3
                  className="heading-md mb-6"
                  style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                >
                  {project.name}
                </h3>

                {/* Description */}
                <p
                  className="paragraph mb-6"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                >
                  {project.description}
                </p>

                {/* Tech stack tags */}
                <ul className="flex flex-wrap gap-2 mb-6 pl-0 list-none" role="list" aria-label="Tech stack">
                  {project.stack.map((tech) => (
                    <li
                      key={tech}
                      className="text-xs font-mono px-2.5 py-1 border border-white/15"
                      style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {tech}
                    </li>
                  ))}
                </ul>

                {/* Links */}
                <ul className="space-y-1.5 pt-2 pl-0 list-none" role="list">
                  {project.links.map((link, linkIndex) => (
                    <li key={linkIndex} className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: 'hsl(0 60% 56%)' }}>•</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
                        style={{ color: 'hsl(0 60% 56%)' }}
                        onClick={() => handleExternalLinkClick(link.title, link.url)}
                      >
                        <ExternalLink size={12} aria-hidden="true" />
                        <span>{link.title}</span>
                        <span className="sr-only">(opens in new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}));

ProjectsSection.displayName = "ProjectsSection";

export default ProjectsSection;
