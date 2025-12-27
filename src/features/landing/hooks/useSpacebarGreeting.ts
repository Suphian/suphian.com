import { useEffect, useRef } from 'react';

/**
 * Hook that triggers a recorded audio greeting when spacebar is pressed.
 * Only works when not typing in input fields.
 */
export const useSpacebarGreeting = () => {
  const isPlayingRef = useRef(false);
  const lastPlayedRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger on spacebar
      if (event.key !== ' ' && event.code !== 'Space') {
        return;
      }

      // Don't trigger if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInputField) {
        return;
      }

      // Prevent default scrolling behavior when we trigger the greeting
      event.preventDefault();

      // Throttle: don't play if we just played within the last 2 seconds
      const now = Date.now();
      if (now - lastPlayedRef.current < 2000) {
        return;
      }

      // Don't trigger if already playing
      if (isPlayingRef.current) {
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create and play the recorded audio
      try {
        const audio = new Audio('/suphian-pronunciation.wav');
        audio.volume = 0.8;
        audioRef.current = audio;

        audio.onplay = () => {
          isPlayingRef.current = true;
          lastPlayedRef.current = Date.now();
        };

        audio.onended = () => {
          isPlayingRef.current = false;
        };

        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          isPlayingRef.current = false;
        };

        audio.play().catch((error) => {
          console.error('Failed to play audio:', error);
          isPlayingRef.current = false;
        });
      } catch (error) {
        console.error('Failed to create audio:', error);
        isPlayingRef.current = false;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      // Stop any playing audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
};

