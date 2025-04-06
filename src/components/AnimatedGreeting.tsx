
import { useState, useEffect } from "react";
import { Greeting } from "../data/greetings";

interface AnimatedGreetingProps {
  greetings: Greeting[];
}

const AnimatedGreeting = ({ greetings }: AnimatedGreetingProps) => {
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [animationState, setAnimationState] = useState<'entering' | 'visible' | 'exiting'>('visible');
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Start exit animation
      setAnimationState('exiting');
      
      // After exit animation completes, change greeting and start enter animation
      setTimeout(() => {
        setCurrentGreetingIndex((prevIndex) => (prevIndex + 1) % greetings.length);
        setAnimationState('entering');
        
        // After enter animation completes, set to visible state
        setTimeout(() => {
          setAnimationState('visible');
        }, 300); // Faster animation (300ms)
      }, 300); // Faster animation (300ms)
      
    }, 1000); // Change greeting every 1 second
    
    return () => clearInterval(intervalId);
  }, [greetings.length]);
  
  const currentGreeting = greetings[currentGreetingIndex];
  
  const getAnimationClass = () => {
    switch (animationState) {
      case 'entering': return 'greeting-animation-enter';
      case 'exiting': return 'greeting-animation-exit';
      default: return '';
    }
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
