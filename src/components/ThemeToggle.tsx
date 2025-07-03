import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-secondary animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "relative w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80",
        "transition-all duration-300 hover:scale-110",
        "flex items-center justify-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            theme === "dark" ? "scale-0 rotate-90" : "scale-100 rotate-0"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300",
            theme === "dark" ? "scale-100 rotate-0" : "scale-0 -rotate-90"
          )}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;