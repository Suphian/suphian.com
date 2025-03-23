
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import CompanyLogos from "@/components/CompanyLogos";
import { ButtonCustom } from "@/components/ui/button-custom";
import { initializeRevealAnimations } from "@/lib/animations";

const Index = () => {
  // Get only the specified featured projects by ID
  const featuredProjectIds = [
    "ai-powered-deal-enablement",
    "duolingo-language-ai",
    "digital-marketing-optimization"
  ];
  
  // Import the projects and filter for the featured ones
  const { projects } = require("@/lib/projects");
  const featuredProjects = projects.filter(project => 
    featuredProjectIds.includes(project.id)
  );

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
            className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal"
            style={{ transitionDelay: "150ms" }}
          >
            {featuredProjects.map((project) => (
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
