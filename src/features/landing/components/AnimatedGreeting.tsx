import { useState, useEffect } from "react";
import { Greeting } from "@/features/landing/data/greetings";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface AnimatedGreetingProps {
  greetings: Greeting[];
}

const AnimatedGreeting = ({ greetings }: AnimatedGreetingProps) => {
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [animationState, setAnimationState] = useState<'visible' | 'changing'>('visible');
  const isMobile = useIsMobile();
  
  // Filter greetings based on device screen size
  const filteredGreetings = isMobile 
    ? greetings.filter(greeting => greeting.text.length <= 4)
    : greetings;
  
  useEffect(() => {
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
  
  return (
    <span className={`inline-block ${getAnimationClass()} ${getLanguageClass(currentGreeting.text)}`}>
      {currentGreeting.text}
    </span>
  );
};

export default AnimatedGreeting;
