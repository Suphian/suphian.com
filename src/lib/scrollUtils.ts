
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
  // Modified timing to keep landing visible longer
  const landingFadeOutStart = viewportHeight * 0.4; // Start fading later
  const landingFadeOutEnd = viewportHeight * 0.9;   // End fading later
  
  // Image transitions - appear sooner and stay longer
  const imageAppearStart = viewportHeight * 0.1;    // Start earlier
  const imageAppearEnd = viewportHeight * 0.4;      // Complete sooner
  
  const imageFadeOutStart = viewportHeight * 0.6;   // Start fading earlier (changed from 0.7)
  const imageFadeOutEnd = viewportHeight * 0.9;     // End fade earlier (changed from 1.1)
  
  // Projects appear timing adjusted for smoother transition - now earlier
  const projectsAppearStart = viewportHeight * 0.7; // Start earlier (changed from 0.8)
  const projectsAppearEnd = viewportHeight * 1.0;   // Complete earlier (changed from 1.2)

  // Wave transition for projects section - also earlier
  const projectWaveAppearStart = viewportHeight * 0.6; // Start earlier (changed from 0.7)
  const projectWaveAppearEnd = viewportHeight * 0.9;   // End sooner (changed from 1.0)

  // Calculate progress for each stage (0 to 1)
  const landingProgress = calculateProgress(scrollPosition, landingFadeOutStart, landingFadeOutEnd);
  const imageAppearProgress = calculateProgress(scrollPosition, imageAppearStart, imageAppearEnd);
  const imageFadeOutProgress = calculateProgress(scrollPosition, imageFadeOutStart, imageFadeOutEnd);
  const projectsAppearProgress = calculateProgress(scrollPosition, projectsAppearStart, projectsAppearEnd);
  const projectWaveProgress = calculateProgress(scrollPosition, projectWaveAppearStart, projectWaveAppearEnd);

  // Apply easing functions for smoother transitions
  const easedLandingProgress = easeOutCubic(landingProgress);
  const easedImageAppearProgress = easeInOutCubic(imageAppearProgress);
  const easedImageFadeOutProgress = easeInCubic(imageFadeOutProgress);
  const easedProjectsAppearProgress = easeOutQuad(projectsAppearProgress);
  const easedProjectWaveProgress = easeInOutCubic(projectWaveProgress);

  return {
    // Landing text stays more visible for longer with subtler movement
    landingOpacity: 1 - easedLandingProgress * 0.5,  // Only fade to 50% opacity
    landingTranslateY: -20 * easedLandingProgress,   // Less vertical movement
    landingScale: 1 - (easedLandingProgress * 0.03), // Less scaling
    
    // Image transitions - more dramatic parallax effect but clearer image
    imageOpacity: calculateOpacityWithFadeInOut(easedImageAppearProgress, easedImageFadeOutProgress),
    imageScale: 0.9 + (easedImageAppearProgress * 0.15), // Subtle scale
    imageTranslateY: (40 - (easedImageAppearProgress * 60)) + (30 * easedImageFadeOutProgress), // Enhanced movement
    
    // Wave effect for main transition
    waveOpacity: easedImageAppearProgress * 0.4,
    waveTranslateY: 20 - (easedImageAppearProgress * 30),
    
    // Projects wave transition effect
    projectWaveOpacity: easedProjectWaveProgress * 0.4,
    projectWaveTranslateY: 20 - (easedProjectWaveProgress * 30),
    
    // Projects section fade in - now appears earlier
    projectsOpacity: easedProjectsAppearProgress,
    projectsTranslateY: 40 * (1 - easedProjectsAppearProgress), // Start from lower
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
