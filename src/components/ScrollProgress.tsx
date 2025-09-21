import { useState, useEffect } from 'react';

const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    let cachedScrollHeight = 0;
    let cachedClientHeight = 0;

    const updateCache = () => {
      cachedScrollHeight = document.documentElement.scrollHeight;
      cachedClientHeight = document.documentElement.clientHeight;
    };

    const update = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = cachedScrollHeight - cachedClientHeight;
      const scrolled = winHeightPx > 0 ? (scrollPx / winHeightPx) * 100 : 0;
      setScrollProgress(scrolled);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    const onResize = () => {
      updateCache();
      update();
    };

    // Initial setup
    updateCache();
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true } as any);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-border/20 z-50">
      <div 
        className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};

export default ScrollProgress;