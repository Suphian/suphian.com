
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  stats: string;
  category: string;
  className?: string;
  compact?: boolean;
}

const ProjectCard = ({
  id,
  title,
  description,
  image,
  stats,
  category,
  className,
  compact = false,
}: ProjectCardProps) => {
  return (
    <Link
      to={`/projects/${id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg",
        className
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="tag bg-black/70 text-white">{category}</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col space-y-2 p-4 sm:p-6">
        <h3 className="heading-sm line-clamp-2">{title}</h3>
        
        {!compact && (
          <p className="paragraph line-clamp-3 text-sm sm:text-base">{description}</p>
        )}
        
        <div className="mt-auto pt-4">
          {stats && (
            <p className="text-sm font-medium text-accent mb-4">{stats}</p>
          )}
          
          <div className="flex items-center text-sm font-medium">
            View Case Study
            <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
