import React, { forwardRef, useCallback, memo } from "react";
import { ExternalLink } from "lucide-react";

const ExperienceSection = memo(forwardRef<HTMLDivElement>((props, ref) => {
  const handleExternalLinkClick = useCallback(async (linkTitle: string, url: string) => {
    console.log(`🎯 External link clicked: ${linkTitle}`);
    
    try {
      await window.trackEvent?.("external_link_click", {
        label: linkTitle,
        url: url,
        page: window.location.pathname,
        source: "ExperienceSection",
        type: "external_link",
      });
      console.log(`✅ External link "${linkTitle}" click tracked successfully`);
    } catch (error) {
      console.error(`❌ Failed to track external link "${linkTitle}" click:`, error);
    }
  }, []);

  const experiences = [{
    period: "2020 - Present",
    company: "YouTube",
    role: "Senior Product Manager",
    roleUrl: "",
    description: "Led execution of an AI-powered payment system for high-profile launches including YouTube Shorts and YouTube Premium Lite. Managed over $6 billion in music payments, optimized global operations, and ensured compliance with regulatory and contractual obligations. Also led a major fraud detection initiative that surfaced and mitigated a royalty scam covered by Billboard.",
    links: [{
      url: "https://blog.youtube/news-and-events/introducing-premium-lite/",
      title: "YouTube Premium Lite Launch"
    }, {
      url: "https://blog.youtube/inside-youtube/shorts-revenue-sharing-update/",
      title: "YouTube Shorts Updates"
    }, {
      url: "https://www.billboard.com/pro/youtube-fraud-royalties-scam-irs-latin-chenel-yenddi-mediamuv-adrev/",
      title: "Billboard: YouTube Fraud Detection"
    }, {
      url: "https://blog.youtube/creator-and-artist-stories/6-billion-paid-to-the-music-industry-in-12-months/#:~:text=In%20the%2012%20months%20between,B%20to%20the%20music%20industry.&text=Last%20year%20we%20announced%20a,B%20to%20the%20music%20industry.",
      title: "YouTube: $6B Paid to Music Industry"
    }, {
      url: "https://research.google/blog/unlocking-zero-resource-machine-translation-to-support-new-languages-in-google-translate/",
      title: "Google Research: Zero-Resource Machine Translation"
    }]
  }, {
    period: "2018 - 2020",
    company: "Google",
    role: "Principal Analytical Lead",
    roleUrl: "",
    description: "Served as an in-house analytics advisor for CapitalG portfolio companies and high-growth D2C brands. Led incrementality testing and optimization strategies to improve marketing efficiency and scale growth across platforms like Duolingo and Chewy.com.",
    links: [{
      url: "https://investor.chewy.com/news-and-events/news/news-details/2019/Chewy-Announces-Pricing-of-Initial-Public-Offering/default.aspx",
      title: "Chewy IPO Announcement"
    }, {
      url: "https://www.cmu.edu/project-olympus/news/2015/june/duolingo-raises-45-million-series-d-round-led-by-google-capital-now-valued-at-470m.html",
      title: "Duolingo Series D Funding"
    }]
  }, {
    period: "2014 - 2018",
    company: "Huge Inc",
    role: "Senior Product Analyst",
    roleUrl: "",
    description: "Specialized in site redesigns, A/B testing, and multivariate testing for high-impact brands. Helped improve UX and conversion for companies like Hulu, Apple and AMC Theaters.",
    links: [{
      url: "https://www.hugeinc.com/work/google/",
      title: "Huge Inc: Google Work"
    }, {
      url: "https://www.baincapital.com/news/900-parkas-bains-canada-goes-public",
      title: "Bain Capital: Canada Goose IPO"
    }, {
      url: "https://workingnotworking.com/projects/112837-hulu-redesign",
      title: "Hulu Redesign Project"
    }, {
      url: "https://elephant.is/case-study/beats/",
      title: "Apple: Beats Case Study"
    }]
  }];
  
  return (
    <section id="experience-section" ref={ref} className="mb-32 md:mb-40 py-12">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <h2 className="heading-lg mb-16 text-white" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            EXPERIENCE
          </h2>
          
          <div className="space-y-16 md:space-y-20">
            {experiences.map((exp, index) => (
              <div key={index} className="relative">
                {/* Timeline line (except last) */}
                {index < experiences.length - 1 && (
                  <div 
                    className="absolute left-0 top-12 bottom-0 w-px bg-white/10"
                    style={{ left: '0.5rem' }}
                  />
                )}
                
                <div className="flex gap-6 md:gap-8">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 relative z-10">
                    <div 
                      className="w-3 h-3 rounded-full bg-white/20 border border-white/30"
                      style={{ marginTop: '0.25rem' }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-8">
                    {/* Period */}
                    <div 
                      className="text-sm font-mono mb-2"
                      style={{ color: 'rgba(200, 60, 45, 0.8)' }}
                    >
                      {exp.period}
                    </div>
                    
                    {/* Company */}
                    <h3 
                      className="heading-md mb-1"
                      style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                    >
                      {exp.company}
                    </h3>
                    
                    {/* Role */}
                    {exp.roleUrl ? (
                      <div className="mb-6">
                        <a 
                          href={exp.roleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
                          style={{ color: 'rgba(200, 60, 45, 0.9)' }}
                          onClick={() => handleExternalLinkClick(`${exp.role} at ${exp.company}`, exp.roleUrl)}
                        >
                          <span>{exp.role}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    ) : (
                      <p 
                        className="text-sm font-mono mb-6"
                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {exp.role}
                      </p>
                    )}
                    
                    {/* Description */}
                    <p 
                      className="paragraph mb-6"
                      style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                    >
                      {exp.description}
                    </p>
                    
                    {/* Links */}
                    {exp.links.length > 0 && (
                      <ul className="space-y-1.5 pt-2 pl-0 list-none">
                        {exp.links.map((link, linkIndex) => (
                          <li key={linkIndex} className="flex items-center gap-2">
                            <span className="text-xs font-mono" style={{ color: 'rgba(200, 60, 45, 0.9)' }}>•</span>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs font-mono inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
                              style={{ color: 'rgba(200, 60, 45, 0.9)' }}
                              onClick={() => handleExternalLinkClick(link.title, link.url)}
                            >
                              <ExternalLink size={12} />
                              <span>{link.title}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}));

ExperienceSection.displayName = "ExperienceSection";

export default ExperienceSection;
