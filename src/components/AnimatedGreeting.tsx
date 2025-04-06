
import { useState, useEffect, useRef } from "react";
import { Greeting } from "../data/greetings";

interface AnimatedGreetingProps {
  greetings: Greeting[];
}

const AnimatedGreeting = ({ greetings }: AnimatedGreetingProps) => {
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [animationState, setAnimationState] = useState<'entering' | 'visible' | 'exiting'>('visible');
  const cycleCompleteRef = useRef(false);
  
  useEffect(() => {
    // Find the index of "Hi" greeting to use at the end
    const hiIndex = greetings.findIndex(greeting => greeting.text === "Hi");
    
    const intervalId = setInterval(() => {
      setCurrentGreetingIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % greetings.length;
        
        // Check if we've gone through the entire array once
        if (nextIndex === 0) {
          cycleCompleteRef.current = true;
          clearInterval(intervalId);
          // Return the index for "Hi" or 0 if not found
          return hiIndex !== -1 ? hiIndex : 0;
        }
        
        return nextIndex;
      });
      
      // Start exit animation
      setAnimationState('exiting');
      
      // After exit animation completes, change greeting and start enter animation
      setTimeout(() => {
        setAnimationState('entering');
        
        // After enter animation completes, set to visible state
        setTimeout(() => {
          setAnimationState('visible');
        }, 250); // Faster animation (250ms - half of 500ms)
      }, 250); // Faster animation (250ms - half of 500ms)
      
    }, 500); // Change greeting every half second
    
    return () => clearInterval(intervalId);
  }, [greetings]);
  
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
