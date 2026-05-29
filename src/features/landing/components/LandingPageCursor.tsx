import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import TypingText from "@/shared/components/common/TypingText";
import HitSpacePrompt from "./HitSpacePrompt";

type AnimationStage = 'greeting' | 'description' | 'deleting-description' | 'passion' | 'deleting-all';

const LandingPageCursor = () => {
  const [currentLanguage, setCurrentLanguage] = useState(0);
  const [showSpacePrompt, _setShowSpacePrompt] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stage, setStage] = useState<AnimationStage>('greeting');
  const hasStartedRef = useRef(false);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Content that rotates through multiple languages
  const content = useMemo(() => [
    {
      greeting: "Hi, I'm Suphian.",
      description: "I'm a product manager at YouTube leading payments.",
      passion: "I'm passionate about crafting exceptional experiences powered by data, design, and cutting-edge tech.",
      language: "English"
    },
    {
      greeting: "Hola, soy Suphian.",
      description: "Soy gerente de productos liderando pagos en YouTube.",
      passion: "Apasionado por crear experiencias excepcionales con datos, diseño y tecnología.",
      language: "Spanish"
    },
    {
      greeting: "Salut, je suis Suphian.",
      description: "Je suis chef de produit dirigeant les paiements chez YouTube.",
      passion: "Passionné par la création d'expériences exceptionnelles avec données, design et technologie.",
      language: "French"
    },
    {
      greeting: "مرحبا، أنا سفيان.",
      description: "أنا مدير منتجات أقود المدفوعات في يوتيوب.",
      passion: "شغوف بإنشاء تجارب استثنائية مدعومة بالبيانات والتصميم والتكنولوجيا.",
      language: "Arabic"
    },
    {
      greeting: "Ciao, sono Suphian.",
      description: "Sono product manager che guida i pagamenti su YouTube.",
      passion: "Appassionato di creare esperienze eccezionali con dati, design e tecnologia.",
      language: "Italian"
    },
    {
      greeting: "Olá, sou Suphian.",
      description: "Sou gerente de produtos liderando pagamentos no YouTube.",
      passion: "Apaixonado por criar experiências excepcionais com dados, design e tecnologia.",
      language: "Portuguese"
    },
    {
      greeting: "Hallo, ich bin Suphian.",
      description: "Ich bin Product Manager und leite Zahlungen bei YouTube.",
      passion: "Leidenschaftlich für außergewöhnliche Erfahrungen durch Daten, Design und Technologie.",
      language: "German"
    },
    {
      greeting: "こんにちは、スフィアン。",
      description: "YouTubeで決済をリードするプロダクトマネージャーです。",
      passion: "データ、デザイン、技術で卓越した体験を創造することに情熱を注いでいます。",
      language: "Japanese"
    },
    {
      greeting: "你好，我是苏菲安。",
      description: "我是YouTube负责支付的产品经理。",
      passion: "热衷于通过数据、设计和科技打造卓越体验。",
      language: "Chinese"
    },
    {
      greeting: "안녕하세요, 수피안.",
      description: "YouTube에서 결제를 이끄는 제품 관리자입니다.",
      passion: "데이터, 디자인, 기술로 탁월한 경험을 만드는 데 열정적입니다.",
      language: "Korean"
    },
    {
      greeting: "Привет, я Суфиан.",
      description: "Я менеджер по продуктам, ведущий платежи в YouTube.",
      passion: "Увлечен созданием исключительного опыта через данные, дизайн и технологии.",
      language: "Russian"
    },
    {
      greeting: "नमस्ते, मैं सुफियान हूँ।",
      description: "मैं YouTube पर भुगतान का नेतृत्व करने वाला उत्पाद प्रबंधक हूँ।",
      passion: "डेटा, डिज़ाइन और तकनीक से असाधारण अनुभव बनाने के लिए उत्साही।",
      language: "Hindi"
    },
    {
      greeting: "Merhaba, ben Suphian.",
      description: "YouTube'da ödemeleri yöneten bir ürün yöneticisiyim.",
      passion: "Veri, tasarım ve teknoloji ile olağanüstü deneyimler yaratmaya tutkulu.",
      language: "Turkish"
    },
    {
      greeting: "Hoi, ik ben Suphian.",
      description: "Ik ben productmanager die betalingen leidt bij YouTube.",
      passion: "Gepassioneerd over uitzonderlijke ervaringen door data, design en technologie.",
      language: "Dutch"
    },
    {
      greeting: "Hej, jag är Suphian.",
      description: "Jag är produktchef som leder betalningar på YouTube.",
      passion: "Passionerad över att skapa exceptionella upplevelser med data, design och teknik.",
      language: "Swedish"
    },
    {
      greeting: "Hei, jeg er Suphian.",
      description: "Jeg er produktleder som leder betalinger på YouTube.",
      passion: "Lidenskapelig opptatt av å skape eksepsjonelle opplevelser med data, design og teknologi.",
      language: "Norwegian"
    },
    {
      greeting: "Γεια, είμαι ο Suphian.",
      description: "Είμαι διαχειριστής προϊόντων που ηγείται των πληρωμών στο YouTube.",
      passion: "Παθιασμένος με τη δημιουργία εξαιρετικών εμπειριών με δεδομένα, σχεδιασμό και τεχνολογία.",
      language: "Greek"
    },
    {
      greeting: "Cześć, jestem Suphian.",
      description: "Jestem kierownikiem produktu prowadzącym płatności w YouTube.",
      passion: "Pasjonuję się tworzeniem wyjątkowych doświadczeń z danymi, designem i technologią.",
      language: "Polish"
    }
  ], []);

  // Start initial animation
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      // Respect reduced motion: show static greeting + description and skip the
      // auto-cycling typing animation entirely (WCAG 2.2.2 / 2.3.3).
      if (prefersReducedMotion.current) {
        setStage('description');
        setIsTyping(false);
        setDisplayedText(content[0].greeting + ' ' + content[0].description);
        return;
      }
      setStage('greeting');
      setIsTyping(true);
      setDisplayedText(content[0].greeting);
    }
  }, [content]);

  const handleTypingComplete = useCallback(() => {
    setIsTyping(false);

    // Under reduced motion the content is shown statically and must not cycle.
    if (prefersReducedMotion.current) {
      return;
    }

    const current = content[currentLanguage];
    
    switch (stage) {
      case 'greeting':
        // Greeting complete, now type description
        setTimeout(() => {
          setStage('description');
          setIsTyping(true);
          setDisplayedText(current.greeting + ' ' + current.description);
        }, 500);
        break;
        
      case 'description':
        // Description complete, wait then delete back to greeting
        // The greeting should stay - we only delete the description part
        setTimeout(() => {
          setStage('deleting-description');
          setIsTyping(true);
          // Set to greeting - TypingText will detect this is a prefix and delete only the extra part
          setDisplayedText(current.greeting);
        }, 2000);
        break;
        
      case 'deleting-description':
        // Deleted back to greeting, now type passion
        setTimeout(() => {
          setStage('passion');
          setIsTyping(true);
          setDisplayedText(current.greeting + ' ' + current.passion);
        }, 500);
        break;
        
      case 'passion':
        // Passion complete, wait then delete all and cycle to next language
        setTimeout(() => {
          const nextLanguage = (currentLanguage + 1) % content.length;
          setCurrentLanguage(nextLanguage);
          
          setStage('deleting-all');
          setIsTyping(true);
          setDisplayedText(''); // This triggers deletion in TypingText
        }, 2000);
        break;
        
      case 'deleting-all':
        // All deleted, start new cycle with greeting
        // currentLanguage was already updated in 'passion' stage
        setTimeout(() => {
          setStage('greeting');
          setIsTyping(true);
          setDisplayedText(content[currentLanguage].greeting);
        }, 500);
        break;
    }
  }, [stage, currentLanguage, content]);

  const handleSpacePress = async () => {
    // Scroll to the STORY section so it lands at the top of the viewport.
    // (scroll-margin-top in index.css clears the navbar; min-h-screen on the
    // section makes it fill the viewport.)
    const storySection = document.getElementById("about-section");
    if (storySection) {
      storySection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      
      // Track the spacebar scroll event
      try {
        await window.trackEvent?.("spacebar_scroll", {
          label: "Spacebar pressed to scroll down",
          page: window.location.pathname,
          source: "LandingPage",
          type: "keyboard_navigation",
        });
      } catch (error) {
        console.error("❌ Failed to track spacebar scroll event:", error);
      }
    }
  };

  const isRTL = (lang: string) => lang === "Arabic";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 grain-overlay">
      <div className="max-w-4xl relative z-20 w-full">
        <div className="relative">
          {/* Minimal typing display */}
          <div 
            className="mb-0"
            style={{
              minHeight: '100px',
              height: 'auto',
              display: 'flex',
              alignItems: 'flex-start'
            }}
            dir={isRTL(content[currentLanguage].language) ? "rtl" : "ltr"}
          >
            {(isTyping || displayedText) && (
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-mono font-normal mb-0 w-full"
                dir={isRTL(content[currentLanguage].language) ? "rtl" : "ltr"}
                style={{
                  lineHeight: '1.4',
                  margin: 0,
                  padding: 0,
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: 'none',
                  filter: 'none',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}
              >
                <span className="block" style={{ color: 'rgba(255, 255, 255, 0.9)' }} aria-live="polite" aria-atomic="true">
                  <TypingText
                    text={displayedText}
                    speed={60}
                    delay={0}
                    onComplete={handleTypingComplete}
                    className=""
                  />
                  {isTyping && (
                    <span className="inline-block w-0.5 h-6 md:h-8 bg-white ml-1 animate-pulse" aria-hidden="true" style={{ animationDuration: '1s' }} />
                  )}
                </span>
              </h1>
            )}
          </div>
        </div>
      </div>

      {showSpacePrompt && (
        <HitSpacePrompt onSpacePress={handleSpacePress} />
      )}
    </div>
  );
};

export default LandingPageCursor;
