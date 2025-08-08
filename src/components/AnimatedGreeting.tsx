import { useState, useEffect, useRef } from "react";
import { Greeting } from "../data/greetings";
import { useIsMobile } from "../hooks/use-mobile";

interface AnimatedGreetingProps {
  greetings: Greeting[];
}

const AnimatedGreeting = ({ greetings }: AnimatedGreetingProps) => {
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [animationState, setAnimationState] = useState<'visible' | 'changing'>('visible');
  const [blotterReady, setBlotterReady] = useState(false);
  const isMobile = useIsMobile();

  const blotterContainerRef = useRef<HTMLSpanElement>(null);
  const blotterRefs = useRef<{ text?: any; scope?: any; blotter?: any } | null>(null);

  // Filter greetings based on device screen size
  const filteredGreetings = isMobile 
    ? greetings.filter(greeting => greeting.text.length <= 4)
    : greetings;

  // Cycle greetings
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAnimationState('changing');
      setTimeout(() => {
        setCurrentGreetingIndex(prevIndex => (prevIndex + 1) % filteredGreetings.length);
        setAnimationState('visible');
      }, 750);
    }, 1500);

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

  // Lazy-load Blotter.js and apply effect on desktop with reduced-motion respected
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointerCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (prefersReduced || (isMobile && pointerCoarse)) return; // Skip on true mobile or when reduced motion is preferred

    let mounted = true;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        // Avoid duplicate script loads
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });

    const initBlotter = () => {
      if (!mounted || !blotterContainerRef.current) return;
      const B = (window as any).Blotter;
      if (!B) return;

      // Compute styles from current element
      const computed = getComputedStyle(blotterContainerRef.current);
      const fontSizePx = parseFloat(computed.fontSize || '48');
      const color = computed.color || 'currentColor';
      const family = computed.fontFamily || 'Montserrat, system-ui, sans-serif';

      // Clear any fallback text
      try { blotterContainerRef.current.innerHTML = ''; } catch {}

      // Create text + material
      const text = new B.Text(currentGreeting.text, {
        family,
        size: fontSizePx,
        fill: color
      });

      const material = new B.LiquidDistortMaterial();
      // Subtle, performant defaults
      material.uniforms.uSpeed.value = 0.15;
      material.uniforms.uVolatility.value = 0.1;
      material.uniforms.uSeed.value = 0.3;

      const blotter = new B(material, { texts: text });
      const scope = blotter.forText(text);
      scope.appendTo(blotterContainerRef.current);

      blotterRefs.current = { text, scope, blotter };
      setBlotterReady(true);
    };

    // Load dependencies in order: Underscore -> Three -> Blotter core -> material
    const underscoreSrc = 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.13.6/underscore-min.js';
    const threeSrc = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    const coreSrc = 'https://cdn.jsdelivr.net/gh/bradley/Blotter@v0.1.0/build/blotter.min.js';
    const matSrc = 'https://cdn.jsdelivr.net/gh/bradley/Blotter@v0.1.0/build/materials/liquidDistortMaterial.js';

    loadScript(underscoreSrc)
      .then(() => loadScript(threeSrc))
      .then(() => loadScript(coreSrc))
      .then(() => loadScript(matSrc))
      .then(initBlotter)
      .catch(() => {
        // Silently fall back to plain text on failure
        setBlotterReady(false);
      });

    return () => {
      mounted = false;
      // Cleanup Blotter scope/canvas
      if (blotterRefs.current?.scope && blotterRefs.current.scope.remove) {
        try { blotterRefs.current.scope.remove(); } catch {}
      }
      blotterRefs.current = null;
      setBlotterReady(false);
      try { if (blotterContainerRef.current) blotterContainerRef.current.innerHTML = ''; } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Blotter text when greeting changes
  useEffect(() => {
    const B = (window as any).Blotter;
    if (blotterRefs.current?.text && B) {
      try {
        // Blotter.Text exposes a value property to update the rendered content
        blotterRefs.current.text.value = currentGreeting.text;
      } catch {}
    }
  }, [currentGreeting.text]);

  return (
    <span className={`inline-block relative ${getAnimationClass()} ${getLanguageClass(currentGreeting.text)}`}>
      {/* Accessible fallback text (visible if Blotter fails or is disabled) */}
      <span className="sr-only">{currentGreeting.text}</span>
      {/* Blotter canvas target */}
      <span
        ref={blotterContainerRef}
        aria-hidden="true"
        className="inline-block align-baseline"
      >
        {/* If Blotter hasn't loaded yet, show plain text visually */}
        {!blotterReady && (
          <span>{currentGreeting.text}</span>
        )}
      </span>
    </span>
  );
};

export default AnimatedGreeting;
