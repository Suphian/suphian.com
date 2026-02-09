import { useState, useEffect, useRef } from "react";
import { Greeting } from "@/features/landing/data/greetings";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface AnimatedGreetingProps {
  greetings: Greeting[];
}

const AnimatedGreeting = ({ greetings }: AnimatedGreetingProps) => {
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [animationState, setAnimationState] = useState<'visible' | 'changing'>('visible');
  const isMobile = useIsMobile();
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Filter greetings based on device screen size
  const filteredGreetings = isMobile
    ? greetings.filter(greeting => greeting.text.length <= 4)
    : greetings;

  useEffect(() => {
    // Skip animation cycling if user prefers reduced motion
    if (prefersReducedMotion.current) return;

    const intervalId = setInterval(() => {
      // Start transition out
      setAnimationState('changing');

      // After animation completes, change to next greeting
      setTimeout(() => {
        setCurrentGreetingIndex(prevIndex => (prevIndex + 1) % filteredGreetings.length);
        setAnimationState('visible');
      }, 800); // Match the 0.8s animation duration

    }, 2000); // 2 seconds total cycle for more focus on each greeting

    return () => clearInterval(intervalId);
  }, [filteredGreetings.length]);
  
  const currentGreeting = filteredGreetings[currentGreetingIndex] || greetings[0];
  
  const getAnimationClass = () => {
    return animationState === 'changing' ? 'greeting-animation-exit' : '';
  };
  
  const getLanguageClass = (text: string) => {
    if (text === "سلام" || text.match(/[\u0600-\u06FF]/)) return "font-cairo";
    if (text.match(/[\u0900-\u097F]/)) return "font-montserrat"; // Hindi and related scripts
    if (text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/)) return "font-montserrat"; // CJK characters
    return "font-montserrat";
  };
  
  // Map greeting language to BCP 47 lang code
  const getLangCode = (text: string) => {
    if (text.match(/[\u0600-\u06FF]/)) return "ar";
    if (text.match(/[\u0900-\u097F]/)) return "hi";
    if (text.match(/[\u3040-\u309F\u30A0-\u30FF]/)) return "ja";
    if (text.match(/[\u4E00-\u9FFF]/)) return "zh";
    if (text.match(/[\uAC00-\uD7AF]/)) return "ko";
    if (text.match(/[\u0400-\u04FF]/)) return "ru";
    if (text.match(/[\u0370-\u03FF]/)) return "el";
    return undefined;
  };

  return (
    <span
      className={`inline-block ${getAnimationClass()} ${getLanguageClass(currentGreeting.text)}`}
      aria-live="polite"
      role="status"
      lang={getLangCode(currentGreeting.text)}
    >
      {currentGreeting.text}
    </span>
  );
};

export default AnimatedGreeting;
