
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const ExperienceSection = () => {
  const experiences = [
    {
      period: "2020 - Present",
      company: "YouTube",
      role: "Senior Product Manager",
      description: "Led execution of an AI-powered payment system for high-profile launches including YouTube Shorts and YouTube Premium Lite. Managed over $6 billion in music payments, optimized global operations, and ensured compliance with regulatory and contractual obligations. Also led a major fraud detection initiative that surfaced and mitigated a royalty scam covered by Billboard.",
      links: [
        {
          url: "https://blog.youtube/news-and-events/introducing-premium-lite/",
          title: "YouTube Premium Lite Launch"
        },
        {
          url: "https://blog.youtube/news-and-events/tall-updates-coming-to-shorts/",
          title: "YouTube Shorts Updates"
        },
        {
          url: "https://www.billboard.com/pro/youtube-fraud-royalties-scam-irs-latin-chenel-yenddi-mediamuv-adrev/",
          title: "Billboard: YouTube Fraud Detection"
        }
      ]
    },
    {
      period: "2018 - 2020",
      company: "Venture Advisor",
      role: "CapitalG, Duolingo, Chewy",
      description: "Served as an in-house analytics advisor for CapitalG portfolio companies and high-growth D2C brands. Led incrementality testing and optimization strategies to improve marketing efficiency and scale growth across platforms like Duolingo and Chewy.com.",
      links: [
        {
          url: "https://investor.chewy.com/news-and-events/news/news-details/2019/Chewy-Announces-Pricing-of-Initial-Public-Offering/default.aspx",
          title: "Chewy IPO Announcement"
        },
        {
          url: "https://www.cmu.edu/project-olympus/news/2015/june/duolingo-raises-45-million-series-d-round-led-by-google-capital-now-valued-at-470m.html",
          title: "Duolingo Series D Funding"
        }
      ]
    },
    {
      period: "2014 - 2016",
      company: "Huge Inc",
      role: "Digital Strategist",
      description: "Specialized in site redesigns, A/B testing, and multivariate testing for high-impact brands. Helped improve UX and conversion for companies like Canada Goose, supporting their transition into the public markets, and delivered measurable lift for clients including Bain & Company.",
      links: [
        {
          url: "https://www.baincapital.com/news/900-parkas-bains-canada-goose-goes-public",
          title: "Bain Capital: Canada Goose IPO"
        }
      ]
    }
  ];

  return (
    <section className="mb-20 reveal relative">
      {/* Updated heading to match the heading-xl class used in AboutSection */}
      <h2 className="heading-xl mb-12 text-left">Experience</h2>
      
      {/* Added similar fade/transition overlay like the one used in scroll transitions */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/80 to-transparent opacity-50 -top-32 h-64 z-0"></div>
      
      <div className="grid grid-cols-1 gap-10 relative z-10">
        {experiences.map((exp, index) => (
          <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300 border border-muted">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left section with period */}
                <div className="p-6 md:border-r border-muted bg-muted/10">
                  <span className="text-accent text-sm font-medium block">{exp.period}</span>
                  <h3 className="heading-sm mt-2">{exp.company}</h3>
                  <p className="text-sm text-muted-foreground">{exp.role}</p>
                </div>
                
                {/* Right section with description and links */}
                <div className="p-6 md:col-span-3 flex flex-col">
                  <p className="text-sm text-foreground mb-6">{exp.description}</p>
                  
                  {exp.links.length > 0 && (
                    <div className="mt-auto">
                      <h4 className="text-xs uppercase text-muted-foreground font-medium tracking-wider mb-2">Related Links</h4>
                      <div className="space-y-2">
                        {exp.links.map((link, linkIndex) => (
                          <a 
                            key={linkIndex}
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-2"
                          >
                            <ExternalLink size={12} />
                            <span className="truncate">{link.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ExperienceSection;
