
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const greetings = [
  { text: "Hi", lang: "English" },
  { text: "سلام", lang: "Arabic" },
  { text: "你好", lang: "Chinese" },
  { text: "Привет", lang: "Russian" },
  { text: "Hola", lang: "Spanish" },
  { text: "Salut", lang: "French" },
  { text: "こんにちは", lang: "Japanese" }
];

const LandingPage = () => {
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
        }, 600); // Match this to the CSS animation duration
      }, 600); // Match this to the CSS animation duration
      
    }, 3000); // Change greeting every 3 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  const currentGreeting = greetings[currentGreetingIndex];
  
  const getAnimationClass = () => {
    switch (animationState) {
      case 'entering': return 'greeting-animation-enter';
      case 'exiting': return 'greeting-animation-exit';
      default: return '';
    }
  };
  
  const getLanguageClass = (text: string) => {
    if (text === "سلام") return "font-cairo";
    return "font-montserrat";
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Logo in top-left corner */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <img 
          src="/lovable-uploads/e95f9219-fcb6-4a0e-bd75-7d6c2000fb1b.png" 
          alt="Suphian Logo" 
          className="h-12 md:h-16"
        />
      </div>

      {/* Main content */}
      <div className="max-w-4xl">
        <h1 className="heading-xl mb-6 flex flex-wrap items-baseline">
          <span className={`inline-block ${getAnimationClass()} ${getLanguageClass(currentGreeting.text)}`}>
            {currentGreeting.text}
          </span>
          <span className="ml-2 font-montserrat font-black">, I'm Suphian.</span>
        </h1>
        
        <p className="text-2xl md:text-3xl lg:text-4xl font-montserrat font-bold mb-4">
          I lead payments at <span className="text-youtubeRed">YouTube</span> for Music.
        </p>
        
        <p className="text-xl md:text-2xl font-montserrat mb-4 text-primary/90">
          Previously launched products at Hulu, Duolingo, and Chewy.com.
        </p>
        
        <p className="text-lg md:text-xl font-montserrat text-primary/80 max-w-3xl">
          I love solving complex problems with thoughtful design and data-driven insights.
        </p>
        
        <div className="mt-12 flex gap-4">
          <Link 
            to="/projects" 
            className="bg-youtubeRed text-primary px-6 py-3 rounded-md font-montserrat font-bold hover:bg-opacity-90 transition-all duration-300"
          >
            View My Work
          </Link>
          <Link 
            to="/contact" 
            className="border border-primary/30 text-primary px-6 py-3 rounded-md font-montserrat font-bold hover:bg-primary/10 transition-all duration-300"
          >
            Contact Me
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
