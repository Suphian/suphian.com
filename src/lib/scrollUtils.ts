
/**
 * Calculates scroll-based animation values for a multi-stage transition
 * @param scrollPosition Current scroll position
 * @param viewportHeight Viewport height
 * @returns Object containing calculated animation values for each transition stage
 */
export const calculateScrollAnimationValues = (
  scrollPosition: number,
  viewportHeight: number
) => {
  // Define transition points relative to viewport height
  const landingFadeOutStart = 0;
  const landingFadeOutEnd = viewportHeight * 0.4;
  
  const imageAppearStart = viewportHeight * 0.5;
  const imageAppearEnd = viewportHeight * 0.7;
  
  const imageFadeOutStart = viewportHeight * 0.8;
  const imageFadeOutEnd = viewportHeight * 1.2;
  
  const projectsAppearStart = viewportHeight * 1.3;
  const projectsAppearEnd = viewportHeight * 1.5;

  // Calculate progress for each stage (0 to 1)
  const landingProgress = calculateProgress(scrollPosition, landingFadeOutStart, landingFadeOutEnd);
  const imageAppearProgress = calculateProgress(scrollPosition, imageAppearStart, imageAppearEnd);
  const imageFadeOutProgress = calculateProgress(scrollPosition, imageFadeOutStart, imageFadeOutEnd);
  const projectsAppearProgress = calculateProgress(scrollPosition, projectsAppearStart, projectsAppearEnd);

  return {
    // Landing text fade out
    landingOpacity: 1 - landingProgress,
    
    // Image transitions
    imageOpacity: calculateOpacityWithFadeInOut(imageAppearProgress, imageFadeOutProgress),
    imageScale: 1 - (imageAppearProgress * 0.1), // Subtle scale effect
    imageTranslateY: -50 * imageAppearProgress, // Move up as it appears
    
    // Projects section fade in
    projectsOpacity: projectsAppearProgress,
    projectsTranslateY: 30 * (1 - projectsAppearProgress), // Move up as it appears
  };
};

/**
 * Helper function to calculate progress within a range
 */
const calculateProgress = (current: number, start: number, end: number): number => {
  if (current <= start) return 0;
  if (current >= end) return 1;
  return (current - start) / (end - start);
};

/**
 * Calculates opacity with both fade-in and fade-out stages
 */
const calculateOpacityWithFadeInOut = (appearProgress: number, fadeOutProgress: number): number => {
  // During appear stage
  if (appearProgress < 1) {
    return appearProgress;
  }
  
  // During fade-out stage
  return 1 - fadeOutProgress;
};
