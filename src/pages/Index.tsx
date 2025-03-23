
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import CompanyLogos from "@/components/CompanyLogos";
import { ButtonCustom } from "@/components/ui/button-custom";
import { ArrowRight, FileText } from "lucide-react";
import { projects } from "@/lib/projects";
import { initializeRevealAnimations } from "@/lib/animations";

const Index = () => {
  const featuredProjects = projects.slice(0, 3);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, []);

  return (
    <div>
      <Hero />

      {/* Featured Projects Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container-custom">
          <div className="flex flex-col items-center text-center mb-12 reveal">
            <span className="tag mb-4">Featured Work</span>
            <h2 className="heading-lg max-w-3xl text-balance">
              Innovative Solutions with Measurable Impact
            </h2>
            <p className="paragraph max-w-2xl mt-4">
              Explore some of my most impactful projects that have transformed businesses
              and improved experiences through AI and payment innovations.
            </p>
          </div>

          <div 
            ref={sectionRef} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal"
            style={{ transitionDelay: "150ms" }}
          >
            {featuredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                description={project.description}
                image={project.image}
                stats={project.stats}
                category={project.category}
              />
            ))}
          </div>

          <div 
            className="flex justify-center mt-12 reveal" 
            style={{ transitionDelay: "300ms" }}
          >
            <ButtonCustom variant="outline" size="lg" arrowIcon>
              <Link to="/projects">View All Projects</Link>
            </ButtonCustom>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <CompanyLogos />

      {/* Research Publication Section */}
      <section className="py-16 bg-secondary/20">
        <div className="container-custom">
          <div className="flex flex-col items-center text-center mb-10 reveal">
            <span className="tag mb-4">Research Publication</span>
            <h2 className="heading-lg max-w-3xl text-balance">
              Google Research Publication
            </h2>
          </div>

          <div className="max-w-4xl mx-auto reveal" style={{ transitionDelay: "150ms" }}>
            <div className="flex flex-col md:flex-row gap-8 items-center bg-background rounded-xl p-6 shadow-sm border border-border/60">
              <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-primary/10 rounded-full">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              
              <div className="flex-1">
                <h3 className="heading-sm mb-2">Unlocking Zero-Resource Machine Translation</h3>
                <p className="paragraph mb-4">
                  Contributed to research featured in the Google Research Blog on "Unlocking Zero-Resource Machine Translation," 
                  expanding Google Translate to 24 new languages by developing novel techniques for using monolingual data.
                </p>
                <ButtonCustom variant="outline" size="sm" arrowIcon>
                  <a 
                    href="https://research.google/blog/unlocking-zero-resource-machine-translation-to-support-new-languages-in-google-translate/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Read Publication
                  </a>
                </ButtonCustom>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container-custom">
          <div className="flex flex-col items-center text-center reveal">
            <h2 className="heading-lg max-w-2xl text-balance mb-6">
              Ready to transform your product with AI and payment innovation?
            </h2>
            <p className="paragraph text-primary-foreground/80 max-w-xl mb-8">
              Let's discuss how my experience in AI systems and payment solutions
              can help drive your business forward.
            </p>
            <ButtonCustom 
              className="bg-white text-primary hover:bg-white/90" 
              size="lg" 
              arrowIcon
            >
              <Link to="/contact">Get in Touch</Link>
            </ButtonCustom>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
