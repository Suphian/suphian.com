
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
          // Don't immediately jump to "Hi", just let the cycle complete naturally
          // We'll handle the Hi transition after the cycle completes
        }
        
        return nextIndex;
      });
      
      // Start exit animation
      setAnimationState('exiting');
      
      // After exit animation completes, change greeting and start enter animation
      setTimeout(() => {
        // Check if we've completed the cycle and should now transition to "Hi"
        if (cycleCompleteRef.current) {
          clearInterval(intervalId);
          
          // Wait for current animation to complete before switching to Hi
          setTimeout(() => {
            if (hiIndex !== -1) {
              setAnimationState('exiting');
              
              // After exiting, set to Hi
              setTimeout(() => {
                setCurrentGreetingIndex(hiIndex);
                setAnimationState('entering');
                
                // And finally back to visible
                setTimeout(() => {
                  setAnimationState('visible');
                }, 500);
              }, 500);
            }
          }, 500);
          
          return;
        }
        
        setAnimationState('entering');
        
        // After enter animation completes, set to visible state
        setTimeout(() => {
          setAnimationState('visible');
        }, 500); // Half of total animation time (1 second)
      }, 500); // Half of total animation time (1 second)
      
    }, 1000); // Change greeting every 1 second
    
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
