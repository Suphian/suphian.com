
import { useState, useEffect } from "react";
import { Greeting } from "../data/greetings";

interface AnimatedGreetingProps {
  greetings: Greeting[];
}

const AnimatedGreeting = ({ greetings }: AnimatedGreetingProps) => {
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [animationState, setAnimationState] = useState<'visible' | 'changing'>('visible');
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Start transition out
      setAnimationState('changing');
      
      // After animation completes, change to next greeting
      setTimeout(() => {
        setCurrentGreetingIndex(prevIndex => (prevIndex + 1) % greetings.length);
        setAnimationState('visible');
      }, 500);
      
    }, 1000); // Change greeting every second
    
    return () => clearInterval(intervalId);
  }, [greetings.length]);
  
  const currentGreeting = greetings[currentGreetingIndex];
  
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
