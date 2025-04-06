
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const greetings = [
  { text: "Hi", lang: "English" },
  { text: "سلام", lang: "Arabic" },
  { text: "Hola", lang: "Spanish" },
  { text: "Salut", lang: "French" },
  { text: "Ciao", lang: "Italian" },
  { text: "Olá", lang: "Portuguese" },
  { text: "Hallo", lang: "German" },
  { text: "Привет", lang: "Russian" },
  { text: "你好", lang: "Chinese" },
  { text: "こんにちは", lang: "Japanese" },
  { text: "안녕하세요", lang: "Korean" },
  { text: "नमस्ते", lang: "Hindi" },
  { text: "Merhaba", lang: "Turkish" },
  { text: "Habari", lang: "Swahili" },
  { text: "Γεια σας", lang: "Greek" },
  { text: "Cześć", lang: "Polish" },
  { text: "Hej", lang: "Swedish" },
  { text: "Hei", lang: "Norwegian" },
  { text: "Hej", lang: "Danish" },
  { text: "Hallo", lang: "Dutch" },
  { text: "Moi", lang: "Finnish" },
  { text: "Szia", lang: "Hungarian" },
  { text: "Ahoj", lang: "Czech" },
  { text: "Ahoj", lang: "Slovak" },
  { text: "Salut", lang: "Romanian" },
  { text: "Привіт", lang: "Ukrainian" },
  { text: "Labas", lang: "Lithuanian" },
  { text: "Sveiki", lang: "Latvian" },
  { text: "Tere", lang: "Estonian" },
  { text: "Здрасти", lang: "Bulgarian" },
  { text: "Здраво", lang: "Serbian" },
  { text: "Bok", lang: "Croatian" },
  { text: "Živjo", lang: "Slovenian" },
  { text: "Chào", lang: "Vietnamese" },
  { text: "สวัสดี", lang: "Thai" },
  { text: "Kamusta", lang: "Filipino" },
  { text: "Halo", lang: "Indonesian" },
  { text: "Hai", lang: "Malay" },
  { text: "হাই", lang: "Bengali" },
  { text: "سلام", lang: "Urdu" },
  { text: "வணக்கம்", lang: "Tamil" },
  { text: "నమస్కారం", lang: "Telugu" },
  { text: "नमस्कार", lang: "Marathi" },
  { text: "ನಮಸ್ಕಾರ", lang: "Kannada" },
  { text: "नमस्ते", lang: "Nepali" },
  { text: "မင်္ဂလာပါ", lang: "Burmese" },
  { text: "ສະບາຍດີ", lang: "Lao" },
  { text: "សួស្តី", lang: "Khmer" },
  { text: "Сайн уу", lang: "Mongolian" },
  { text: "Сәлем", lang: "Kazakh" },
  { text: "Salom", lang: "Uzbek" },
  { text: "Salam", lang: "Azerbaijani" },
  { text: "გამარჯობა", lang: "Georgian" },
  { text: "Բարև", lang: "Armenian" },
  { text: "Hæ", lang: "Icelandic" },
  { text: "Dia dhuit", lang: "Irish" },
  { text: "Shwmae", lang: "Welsh" },
  { text: "Halò", lang: "Scots Gaelic" },
  { text: "Bongu", lang: "Maltese" },
  { text: "Bawo", lang: "Yoruba" },
  { text: "Ndewo", lang: "Igbo" },
  { text: "Sannu", lang: "Hausa" },
  { text: "Salaam", lang: "Somali" },
  { text: "ሰላም", lang: "Amharic" },
  { text: "Hallo", lang: "Afrikaans" },
  { text: "Sawubona", lang: "Zulu" },
  { text: "Molo", lang: "Xhosa" },
  { text: "Dumela", lang: "Sesotho" },
  { text: "Mhoro", lang: "Shona" },
  { text: "Kia ora", lang: "Maori" },
  { text: "Aloha", lang: "Hawaiian" },
  { text: "Talofa", lang: "Samoan" },
  { text: "Bula", lang: "Fijian" },
  { text: "Saluton", lang: "Esperanto" },
  { text: "Bonjou", lang: "Haitian Creole" },
  { text: "Moien", lang: "Luxembourgish" },
  { text: "Zdravo", lang: "Bosnian" },
  { text: "Здраво", lang: "Macedonian" },
  { text: "Slav", lang: "Kurdish" },
  { text: "سلام", lang: "Pashto" },
  { text: "Салом", lang: "Tajik" },
  { text: "Salam", lang: "Turkmen" },
  { text: "Салам", lang: "Kyrgyz" },
  { text: "Aluu", lang: "Greenlandic" },
  { text: "Kaixo", lang: "Basque" },
  { text: "Hola", lang: "Catalan" },
  { text: "Ola", lang: "Galician" },
  { text: "Adieu", lang: "Occitan" },
  { text: "Hoi", lang: "Frisian" },
  { text: "Allegra", lang: "Romansh" },
  { text: "سلام", lang: "Sindhi" },
  { text: "Salama", lang: "Malagasy" }
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
        }, 300); // Faster animation (300ms)
      }, 300); // Faster animation (300ms)
      
    }, 1000); // Change greeting every 1 second
    
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
    if (text === "سلام" || text.match(/[\u0600-\u06FF]/)) return "font-cairo";
    if (text.match(/[\u0900-\u097F]/)) return "font-montserrat"; // Hindi and related scripts
    if (text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/)) return "font-montserrat"; // CJK characters
    return "font-montserrat";
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4">
      {/* Logo in top-left corner with increased size */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <img 
          src="/lovable-uploads/e95f9219-fcb6-4a0e-bd75-7d6c2000fb1b.png" 
          alt="Suphian Logo" 
          className="h-[45px] md:h-[65px]"
        />
      </div>

      {/* Main content */}
      <div className="max-w-4xl">
        <h1 className="heading-xl mb-6 flex flex-wrap items-baseline relative">
          <span className={`inline-block ${getAnimationClass()} ${getLanguageClass(currentGreeting.text)}`}>
            {currentGreeting.text}
          </span>
          <span className="ml-2 font-montserrat font-black">, I'm Suphian.</span>
          
          {/* Moved the underline outside of the greeting span to extend across the entire heading */}
          <div className="absolute bottom-[-8px] left-0 w-full">
            <svg width="100%" height="8" className="overflow-visible">
              <path 
                d="M0,2 Q30,5 60,2 T120,2 T180,2 T240,2 T300,2 T360,2" 
                fill="none" 
                stroke="#FF3B30" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="wavy-underline"
              />
            </svg>
          </div>
        </h1>
        
        <div className="space-y-4 text-content">
          <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold">
            Product Manager leading payments at YouTube.
          </p>
          
          <p className="text-xl md:text-2xl lg:text-3xl font-montserrat font-bold">
            Previously redesigned digital experiences for Hulu, Apple, Duolingo, and Chewy.com—passionate about crafting elegant, data-driven products powered by thoughtful design and cutting-edge AI.
          </p>
        </div>
        
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
