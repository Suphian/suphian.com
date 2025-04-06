
/**
 * Calculates scroll-based animation values 
 * @param scrollPosition Current scroll position
 * @param viewportHeight Viewport height
 * @returns Object containing calculated animation values
 */
export const calculateScrollAnimationValues = (
  scrollPosition: number,
  viewportHeight: number
) => {
  const scrollProgress = Math.min(scrollPosition / (viewportHeight * 0.6), 1);
  
  return {
    scale: 1 - (scrollProgress * 0.3), // Scale from 1 to 0.7
    translateY: scrollProgress * -100, // Move up as user scrolls
    opacity: 1 - scrollProgress, // Fade out completely as user scrolls
  };
};
