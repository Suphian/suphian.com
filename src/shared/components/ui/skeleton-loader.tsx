import { cn } from "@/shared/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "text" | "image" | "button" | "card";
}

const SkeletonLoader = ({ className, variant = "text" }: SkeletonLoaderProps) => {
  const baseStyles = "animate-pulse bg-muted rounded";
  
  const variantStyles = {
    text: "h-4 w-full",
    image: "aspect-square w-full",
    button: "h-10 w-24",
    card: "h-32 w-full"
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} />
  );
};

export { SkeletonLoader };
