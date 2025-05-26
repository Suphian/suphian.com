
import React from "react";
import { cn } from "@/lib/utils";

interface WaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "youtube";
  size?: "default" | "sm" | "lg";
  className?: string;
  children: React.ReactNode;
}

const WaveButton = React.forwardRef<HTMLButtonElement, WaveButtonProps>(
  ({
    variant = "primary",
    size = "default",
    className,
    children,
    ...props
  }, ref) => {
    const baseStyles = "wave-btn font-montserrat font-bold transition-all duration-300 relative overflow-hidden group rounded-md";
    
    const variantStyles = {
      primary: "bg-primary text-background hover:text-primary-foreground",
      secondary: "bg-secondary text-foreground hover:text-background",
      youtube: "bg-youtubeRed text-primary hover:text-black"
    };
    
    const sizeStyles = {
      default: "px-4 py-2",
      sm: "px-3 py-1.5 text-sm",
      lg: "px-6 py-4"
    };

    const overlayColors = {
      primary: "bg-youtubeRed",
      secondary: "bg-accent",
      youtube: "bg-primary"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <span className="relative z-10 transition-colors duration-300">
          {children}
        </span>
        <span className={cn(
          "absolute inset-0 bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500",
          overlayColors[variant]
        )}></span>
      </button>
    );
  }
);

WaveButton.displayName = "WaveButton";

export { WaveButton };
