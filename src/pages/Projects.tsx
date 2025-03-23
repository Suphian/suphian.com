
import { useEffect, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/projects";
import { initializeRevealAnimations } from "@/lib/animations";

const Projects = () => {
  const [filter, setFilter] = useState<string>("all");
  const categories = ["all", ...new Set(projects.map((project) => project.category))];

  useEffect(() => {
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, []);

  const filteredProjects = filter === "all"
    ? projects
    : projects.filter((project) => project.category === filter);

  return (
    <div className="pt-28 pb-24">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 reveal">
          <span className="tag mb-4">Portfolio</span>
          <h1 className="heading-xl max-w-3xl text-balance mb-6">
            My Projects
          </h1>
          <p className="paragraph max-w-2xl">
            Explore a collection of projects where I've leveraged AI and payment
            innovations to solve complex problems and deliver measurable results.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-12 reveal" style={{ transitionDelay: "150ms" }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {category === "all" ? "All Projects" : category}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal" style={{ transitionDelay: "300ms" }}>
          {filteredProjects.map((project) => (
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
      </div>
    </div>
  );
};

export default Projects;
