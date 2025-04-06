import { useEffect, useRef, useState } from "react";
import { MapPin, Headphones } from "lucide-react";
import { ButtonCustom } from "@/components/ui/button-custom";
import { initializeRevealAnimations } from "@/lib/animations";
import RequestCVModal from "@/components/RequestCVModal";

const About = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const leadershipSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, []);

  return (
    <div className="pt-28 pb-24">
      <div className="container-custom">
        {/* Hero Section with Astronaut */}
        <section id="about-section" ref={aboutSectionRef} className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="flex flex-col space-y-6 reveal">
              <span className="tag mb-2">About Me</span>
              <h1 className="heading-xl text-balance">
                Explore my story
              </h1>
              
              <p className="paragraph">
                Listen to a short podcast about my experience and ask questions in real time.
              </p>
              
              <div className="pt-4 flex flex-col space-y-6">
                <ButtonCustom size="lg" arrowIcon>
                  <a 
                    href="https://notebooklm.google.com/notebook/2849175b-13a1-477d-ace3-9c3c593156a6/audio" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <Headphones className="mr-2 h-5 w-5" />
                    Launch Notebook LLM
                  </a>
                </ButtonCustom>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="mr-2 h-5 w-5" />
                  <span>Currently located in New York City</span>
                </div>
                
                <div>
                  <ButtonCustom 
                    variant="outline" 
                    onClick={() => setIsModalOpen(true)}
                  >
                    Request My CV
                  </ButtonCustom>
                </div>
              </div>
            </div>
            
            {/* Right Content - Astronaut Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg order-first md:order-last reveal" style={{ transitionDelay: "150ms" }}>
              <img
                src="/lovable-uploads/6fbb55f2-ad2f-4646-9f3a-382f1ffc8c31.png"
                alt="Astronaut wearing headphones"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
            </div>
          </div>
        </section>
        
        {/* Experience Section */}
        <section className="mb-20 reveal">
          <h2 className="heading-lg mb-12 text-center">My Experience</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <span className="text-accent text-sm font-medium mb-2 block">2018 - Present</span>
              <h3 className="heading-sm mb-3">YouTube & Google</h3>
              <p className="text-sm text-muted-foreground">
                Led product strategy and execution for AI-powered systems and payment solutions. 
                Developed innovative products that reduced errors, improved efficiency, and 
                enhanced user experiences.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <span className="text-accent text-sm font-medium mb-2 block">2016 - 2018</span>
              <h3 className="heading-sm mb-3">Fintech Startups</h3>
              <p className="text-sm text-muted-foreground">
                Advised Google Ventures portfolio companies on product strategy and go-to-market 
                planning. Helped early-stage fintech startups develop scalable payment systems 
                and compliance frameworks.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <span className="text-accent text-sm font-medium mb-2 block">2014 - 2016</span>
              <h3 className="heading-sm mb-3">Huge Inc</h3>
              <p className="text-sm text-muted-foreground">
                Started my career in growth marketing, driving digital marketing efficiency and 
                developing data-driven strategies. Achieved a 38% improvement in CPA efficiency 
                through innovative campaign optimization.
              </p>
            </div>
          </div>
        </section>
        
        {/* Leadership Philosophy Section */}
        <section id="leadership-section" ref={leadershipSectionRef} className="bg-secondary/30 p-8 md:p-12 rounded-2xl reveal mb-20">
          <h2 className="heading-lg mb-8 text-center">Leadership Philosophy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="heading-md mb-6">My Approach</h3>
              <p className="paragraph mb-6">
                I believe in leading by example and fostering an environment where innovation can thrive.
                My approach combines technical expertise with strategic thinking to deliver products that
                make a meaningful impact on users' lives.
              </p>
              <p className="paragraph">
                Through my career, I've found that the best teams are those where everyone feels empowered
                to contribute their unique perspectives and skills. My role as a leader is to remove
                barriers, provide clear direction, and create opportunities for growth.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl border">
              <h3 className="heading-sm mb-6">Core Values</h3>
              <ul className="space-y-4">
                {[
                  "User-first product development",
                  "Data-driven decision making",
                  "Inclusive and collaborative teamwork",
                  "Continuous learning and adaptation",
                  "Ethical technology implementation"
                ].map((value, index) => (
                  <li key={index} className="flex items-center">
                    <div className="mr-3 bg-accent/20 rounded-full p-1">
                      <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        
        {/* Contact CTA */}
        <section id="contact-section" className="text-center reveal">
          <h2 className="heading-lg mb-6">Let's Connect</h2>
          <p className="paragraph max-w-2xl mx-auto mb-8">
            I'm always open to discussing new projects, opportunities, or partnerships.
          </p>
          <ButtonCustom size="lg" arrowIcon>
            <a href="/contact">Get in Touch</a>
          </ButtonCustom>
        </section>
      </div>
      
      {/* CV Request Modal */}
      <RequestCVModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
};

export default About;
