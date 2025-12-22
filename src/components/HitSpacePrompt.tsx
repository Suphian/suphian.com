import { useEffect, useState, useRef } from 'react';

interface HitSpacePromptProps {
  onSpacePress: () => void;
}

export default function HitSpacePrompt({ onSpacePress }: HitSpacePromptProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const hasPressedRef = useRef(false);

  useEffect(() => {
    // Check initial scroll position on mount
    const checkInitialScroll = () => {
      const scrollY = window.scrollY;
      const topThreshold = 100;
      const hideThreshold = 300;
      
      if (scrollY <= topThreshold && !hasPressedRef.current) {
        // Show if at top of page (only if not pressed)
        setIsVisible(true);
        setShouldRender(true);
      } else if (scrollY > hideThreshold && !hasPressedRef.current) {
        // Hide if scrolled down (but don't mark as pressed)
        setIsVisible(false);
        setTimeout(() => setShouldRender(false), 500);
      }
    };

    // Check immediately and after a short delay to handle any scroll reset
    checkInitialScroll();
    const initialCheckTimeout = setTimeout(checkInitialScroll, 100);

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or other editable element
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable ||
                          target.closest('input, textarea, [contenteditable="true"]');
      
      // Only handle spacebar if not in an input field and prompt is visible
      if (e.code === 'Space' && isVisible && !isInputField && !hasPressedRef.current) {
        e.preventDefault();
        hasPressedRef.current = true;
        setIsPressed(true);
        onSpacePress();
        
        // Hide the prompt after a short delay
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setShouldRender(false), 500); // Wait for fade-out animation
        }, 300);
      }
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const topThreshold = 100; // Show prompt when within 100px of top
      const hideThreshold = 300; // Hide prompt when scrolled more than 300px
      
      // Only manage visibility based on scroll, not the pressed state
      // The pressed state should only be set when user actually presses space or clicks
      if (scrollY <= topThreshold && !hasPressedRef.current) {
        // Show prompt when scrolling back to the top (only if not pressed)
        setIsVisible(true);
        setShouldRender(true);
      }
      // Hide prompt when user scrolls significantly away from the top
      else if (scrollY > hideThreshold && !hasPressedRef.current) {
        // Hide on scroll (but don't mark as pressed - user can scroll back up)
        setIsVisible(false);
        setTimeout(() => setShouldRender(false), 500);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(initialCheckTimeout);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible, onSpacePress]);

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-subtle"
      style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <button
        className="relative text-xs font-mono px-5 py-2.5 border rounded-md transition-all duration-300 hover:scale-105 active:scale-95 space-button-glow"
        style={{ 
          color: '#FF3B30',
          borderColor: '#FF3B30',
          backgroundColor: isPressed ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          opacity: isPressed ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
          e.currentTarget.style.borderColor = '#FF5C45';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.borderColor = '#FF3B30';
        }}
        onClick={() => {
          if (!hasPressedRef.current) {
            hasPressedRef.current = true;
            setIsPressed(true);
            onSpacePress();
            setTimeout(() => {
              setIsVisible(false);
              setTimeout(() => setShouldRender(false), 500);
            }, 300);
          }
        }}
      >
        <kbd 
          className="inline-flex items-center gap-1.5 animate-pulse-slow"
          style={{ color: '#FF3B30' }}
        >
          <span>Space</span>
          <span className="text-[10px] opacity-70">↓</span>
        </kbd>
      </button>
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translate(-50%, 0);
          }
          50% {
            transform: translate(-50%, -8px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s ease-in-out infinite;
        }
        .space-button-glow {
          box-shadow: 0 0 10px rgba(255, 59, 48, 0.2);
        }
        .space-button-glow:hover {
          box-shadow: 0 0 20px rgba(255, 59, 48, 0.4), 0 0 30px rgba(255, 59, 48, 0.2);
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-subtle,
          .animate-pulse-slow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

