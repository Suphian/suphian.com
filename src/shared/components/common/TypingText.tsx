import { useState, useEffect, useRef, useCallback } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
}

export default function TypingText({
  text,
  speed = 30,
  delay = 0,
  className = '',
  onComplete,
  showCursor = true,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDeletingRef = useRef<boolean>(false);
  const prevTextPropRef = useRef<string>('');
  const displayedTextRef = useRef<string>('');

  // Always keep ref in sync with state
  useEffect(() => {
    displayedTextRef.current = displayedText;
  }, [displayedText]);

  // Helper function to get variable typing speed (more natural)
  const getTypingSpeed = (char: string, index: number, _totalLength: number, previousChar?: string): number => {
    let baseSpeed = speed;
    
    // Longer pauses after sentence-ending punctuation (like thinking)
    if (char === '.' || char === '!' || char === '?') {
      baseSpeed = speed * (2.5 + Math.random() * 2);
    }
    // Medium pause after commas and semicolons
    else if (char === ',' || char === ';') {
      baseSpeed = speed * (1.8 + Math.random() * 1.2);
    }
    // Slightly slower after spaces (natural pause)
    else if (char === ' ') {
      baseSpeed = speed * (1.3 + Math.random() * 0.7);
    }
    // Slightly faster for vowels (more common, smoother flow)
    else if (/[aeiouAEIOU]/.test(char)) {
      baseSpeed = speed * (0.8 + Math.random() * 0.5);
    }
    // Variable speed for consonants
    else {
      baseSpeed = speed * (0.6 + Math.random() * 0.7);
    }
    
    // Occasional random micro-pause (5% chance) - simulates natural typing rhythm
    if (Math.random() < 0.05 && index > 0) {
      baseSpeed += speed * (0.3 + Math.random() * 0.4);
    }
    
    // Slightly faster for common 2-character combinations
    if (previousChar) {
      const combo = previousChar.toLowerCase() + char.toLowerCase();
      if (combo === 'th' || combo === 'he' || combo === 'in' || combo === 'er' || combo === 'an') {
        baseSpeed *= 0.85; // Slightly faster for common letter pairs
      }
    }
    
    return Math.max(baseSpeed, 20); // Minimum 20ms for responsiveness
  };

  // Helper function to get deletion speed
  const getDeletionSpeed = (): number => {
    return Math.max(speed / 2, 15); // Minimum 15ms, slower than typing
  };

  // Natural typing
  const typeNextChar = useCallback((targetText: string, currentIndex: number) => {
    if (currentIndex >= targetText.length) {
      // Typing complete
      setIsTyping(false);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const char = targetText[currentIndex];
    const previousChar = currentIndex > 0 ? targetText[currentIndex - 1] : undefined;
    setDisplayedText(targetText.slice(0, currentIndex + 1));
    setIsTyping(true);
    
    const typingSpeed = getTypingSpeed(char, currentIndex, targetText.length, previousChar);
    
    timeoutRef.current = setTimeout(() => {
      typeNextChar(targetText, currentIndex + 1);
    }, typingSpeed);
  }, [speed, onComplete]);

  // Natural deletion
  const deleteNextChar = useCallback((targetText: string, currentIndex: number, onDeleteComplete?: () => void, targetLength: number = 0) => {
    if (currentIndex <= targetLength) {
      // Deletion complete
      const finalText = targetLength > 0 ? targetText.slice(0, targetLength) : '';
      setDisplayedText(finalText);
      setIsTyping(false);
      if (onDeleteComplete) {
        onDeleteComplete();
      } else if (onComplete) {
        onComplete();
      }
      return;
    }

    // Delete one character at a time
    const newText = targetText.slice(0, currentIndex - 1);
    setDisplayedText(newText);
    setIsTyping(true);
    
    const deletionSpeed = getDeletionSpeed();
    
    timeoutRef.current = setTimeout(() => {
      deleteNextChar(targetText, currentIndex - 1, onDeleteComplete, targetLength);
    }, deletionSpeed);
  }, [speed, onComplete]);

  useEffect(() => {
    // Only react to text prop changes
    if (text === prevTextPropRef.current) {
      return;
    }
    
    prevTextPropRef.current = text;
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Use requestAnimationFrame to ensure we read the latest ref value after state updates
    const rafId = requestAnimationFrame(() => {
      const currentDisplayed = displayedTextRef.current;

      // Handle deletion: if text is empty string and we have displayed text
      if (text === '' && !isDeletingRef.current && currentDisplayed.length > 0) {
        isDeletingRef.current = true;
        setIsTyping(false); // Cursor flickers
        
        const textToDelete = currentDisplayed;
        
        timeoutRef.current = setTimeout(() => {
          setIsTyping(true);
          deleteNextChar(textToDelete, textToDelete.length, () => {
            isDeletingRef.current = false;
            // Call onComplete after deletion finishes
            if (onComplete) {
              onComplete();
            }
          });
        }, 2000); // Wait 2 seconds for cursor to flicker
        
        return;
      }

      // Handle typing: if we have text to display
      if (text && text !== '') {
        // Reset deletion flag if it was set
        if (isDeletingRef.current) {
          isDeletingRef.current = false;
        }

        // If we have displayed text that's different
        if (currentDisplayed.length > 0 && currentDisplayed !== text) {
          // Check if the new text is a prefix of the current text (partial deletion)
          // Example: current = "Hi, I'm Suphian. I'm a product manager..."
          //          text = "Hi, I'm Suphian."
          //          → Delete back to greeting, greeting stays!
          if (currentDisplayed.startsWith(text)) {
            setIsTyping(true);
            deleteNextChar(currentDisplayed, currentDisplayed.length, () => {
              if (onComplete) {
                onComplete();
              }
            }, text.length);
            return;
          }
          // Check if the current text is a prefix of the new text (continue typing)
          // Example: current = "Hi, I'm Suphian."
          //          text = "Hi, I'm Suphian. I'm a product manager..."
          //          → Continue typing from where we left off, DON'T retype greeting!
          else if (text.startsWith(currentDisplayed)) {
            setIsTyping(true);
            typeNextChar(text, currentDisplayed.length);
            return;
          }
          // Completely different text - delete all then type new
          else {
            setIsTyping(true);
            deleteNextChar(currentDisplayed, currentDisplayed.length, () => {
              setTimeout(() => {
                typeNextChar(text, 0);
              }, 300);
            });
            return;
          }
        } 
        // First time typing or text matches
        else if (currentDisplayed === '' || currentDisplayed === text) {
          if (currentDisplayed === '') {
            // First time typing
            setDisplayedText('');
            setIsTyping(false);

            timeoutRef.current = setTimeout(() => {
              setIsTyping(true);
              typeNextChar(text, 0);
            }, delay);
            return;
          }
          // Text already matches - do nothing
        }
      }
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text, speed, delay, onComplete, typeNextChar, deleteNextChar]);

  // Detect if text is RTL
  const isRTL = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || displayedText);

  return (
    <span 
      className={`font-terminal ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        color: '#ffffff',
        textShadow: 'none',
        filter: 'none',
      }}
    >
      {displayedText}
      {showCursor && (
        <span
          className="inline-block w-[2px] h-[1em] bg-white ml-1"
          style={{
            animation: isTyping ? 'none' : 'blink 1s infinite',
            opacity: 1,
            verticalAlign: 'baseline',
            marginLeft: isRTL ? 0 : '0.25rem',
            marginRight: isRTL ? '0.25rem' : 0,
            boxShadow: 'none',
            filter: 'none',
          }}
        />
      )}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
