
import { useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getProjectById, projects } from "@/lib/projects";
import { ButtonCustom } from "@/components/ui/button-custom";
import { initializeRevealAnimations } from "@/lib/animations";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = getProjectById(id || "");
  
  const sectionRefs = {
    overview: useRef<HTMLDivElement>(null),
    challenge: useRef<HTMLDivElement>(null),
    role: useRef<HTMLDivElement>(null),
    approach: useRef<HTMLDivElement>(null),
    outcome: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!project) {
      navigate("/projects");
      return;
    }
    
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, [project, navigate]);

  if (!project) return null;

  // Find next and previous projects
  const currentIndex = projects.findIndex((p) => p.id === id);
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const nextProject = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  return (
    <div className="pt-28 pb-24">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col mb-12 reveal">
          <Link 
            to="/projects" 
            className="flex items-center text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
          
          <span className="tag mb-4">{project.category}</span>
          <h1 className="heading-xl max-w-3xl text-balance mb-6">
            {project.title}
          </h1>
          
          <p className="paragraph max-w-2xl">
            {project.description}
          </p>
        </div>

        {/* Hero Image */}
        <div className="aspect-video w-full overflow-hidden rounded-xl mb-16 reveal" style={{ transitionDelay: "150ms" }}>
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div ref={sectionRefs.overview} className="mb-12 reveal">
              <h2 className="heading-md mb-6">Overview</h2>
              <p className="paragraph">
                {project.description}
              </p>
            </div>

            <div ref={sectionRefs.challenge} className="mb-12 reveal">
              <h2 className="heading-md mb-6">The Challenge</h2>
              <p className="paragraph">
                {project.challenge}
              </p>
            </div>

            <div ref={sectionRefs.role} className="mb-12 reveal">
              <h2 className="heading-md mb-6">My Role</h2>
              <p className="paragraph">
                {project.role}
              </p>
            </div>

            <div ref={sectionRefs.approach} className="mb-12 reveal">
              <h2 className="heading-md mb-6">The Approach</h2>
              <p className="paragraph">
                {project.approach}
              </p>
            </div>

            <div ref={sectionRefs.outcome} className="reveal">
              <h2 className="heading-md mb-6">The Outcome</h2>
              <p className="paragraph">
                {project.outcome}
              </p>
            </div>
          </div>

          <div className="col-span-1">
            <div className="sticky top-32 bg-secondary/40 p-6 rounded-xl reveal">
              <h3 className="heading-sm mb-6">Project Stats</h3>
              <ul className="space-y-4">
                {project.stats.split('•').map((stat, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1.5 h-2 w-2 rounded-full bg-accent" />
                    <span className="text-sm">{stat.trim()}</span>
                  </li>
                ))}
              </ul>

              <div className="h-px w-full bg-border my-6" />

              <h3 className="heading-sm mb-6">Interested?</h3>
              <ButtonCustom className="w-full mb-3">
                <Link to="/contact">Discuss a Project</Link>
              </ButtonCustom>
            </div>
          </div>
        </div>

        {/* Project Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border/60 pt-12 reveal">
          {prevProject && (
            <Link 
              to={`/projects/${prevProject.id}`}
              className="group flex flex-col p-6 rounded-xl border hover:shadow-md transition-all"
            >
              <span className="text-xs text-muted-foreground uppercase font-medium mb-2 flex items-center">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Previous Project
              </span>
              <h4 className="font-medium">{prevProject.title}</h4>
            </Link>
          )}
          
          {nextProject && (
            <Link 
              to={`/projects/${nextProject.id}`}
              className={`group flex flex-col p-6 rounded-xl border hover:shadow-md transition-all ${!prevProject ? "sm:col-start-2" : ""}`}
            >
              <span className="text-xs text-muted-foreground uppercase font-medium mb-2 flex items-center justify-end">
                Next Project
                <ArrowRight className="ml-1 h-3 w-3" />
              </span>
              <h4 className="font-medium text-right">{nextProject.title}</h4>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
