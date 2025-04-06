
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
  const landingFadeOutStart = viewportHeight * 0.1;
  const landingFadeOutEnd = viewportHeight * 0.5;
  
  const imageAppearStart = viewportHeight * 0.15; // Start earlier for overlap
  const imageAppearEnd = viewportHeight * 0.6;
  
  const imageFadeOutStart = viewportHeight * 0.7;
  const imageFadeOutEnd = viewportHeight * 1.0;
  
  const projectsAppearStart = viewportHeight * 0.9;
  const projectsAppearEnd = viewportHeight * 1.2;

  // Calculate progress for each stage (0 to 1)
  const landingProgress = calculateProgress(scrollPosition, landingFadeOutStart, landingFadeOutEnd);
  const imageAppearProgress = calculateProgress(scrollPosition, imageAppearStart, imageAppearEnd);
  const imageFadeOutProgress = calculateProgress(scrollPosition, imageFadeOutStart, imageFadeOutEnd);
  const projectsAppearProgress = calculateProgress(scrollPosition, projectsAppearStart, projectsAppearEnd);

  // Apply easing functions for smoother transitions
  const easedLandingProgress = easeOutCubic(landingProgress);
  const easedImageAppearProgress = easeInOutCubic(imageAppearProgress);
  const easedImageFadeOutProgress = easeInCubic(imageFadeOutProgress);
  const easedProjectsAppearProgress = easeOutQuad(projectsAppearProgress);

  return {
    // Landing text fade out and move up
    landingOpacity: 1 - easedLandingProgress * 0.8, // Don't completely fade out for overlap
    landingTranslateY: -40 * easedLandingProgress,
    landingScale: 1 - (easedLandingProgress * 0.05),
    
    // Image transitions - slide from below and behind the text
    imageOpacity: calculateOpacityWithFadeInOut(easedImageAppearProgress, easedImageFadeOutProgress),
    imageScale: 0.9 + (easedImageAppearProgress * 0.2), // Start smaller and grow
    imageTranslateY: (30 - (easedImageAppearProgress * 50)) + (30 * easedImageFadeOutProgress), // Slide up then down
    
    // Wave effect
    waveOpacity: easedImageAppearProgress * 0.4,
    waveTranslateY: 20 - (easedImageAppearProgress * 30),
    
    // Projects section fade in
    projectsOpacity: easedProjectsAppearProgress,
    projectsTranslateY: 30 * (1 - easedProjectsAppearProgress), // Move up as it appears
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

/**
 * Easing functions for smoother animations
 */
const easeOutCubic = (x: number): number => {
  return 1 - Math.pow(1 - x, 3);
};

const easeInCubic = (x: number): number => {
  return x * x * x;
};

const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const easeOutQuad = (x: number): number => {
  return 1 - (1 - x) * (1 - x);
};
