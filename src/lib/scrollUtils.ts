
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

  // Apply ultra-smooth easing functions for parallax
  const easedLandingProgress = easeOutQuart(landingProgress);
  const easedImageAppearProgress = easeOutExpo(imageAppearProgress);
  const easedImageFadeOutProgress = easeInOutQuart(imageFadeOutProgress);
  const easedProjectsAppearProgress = easeOutExpo(projectsAppearProgress);
  const easedProjectWaveProgress = easeInOutQuart(projectWaveProgress);

  return {
    // Landing text with ultra-smooth fade and subtle movement
    landingOpacity: 1 - easedLandingProgress * 0.4,  // Gentler fade to 60% opacity
    landingTranslateY: -25 * easedLandingProgress,   // Smooth upward movement
    landingScale: 1 - (easedLandingProgress * 0.02), // Very subtle scaling
    
    // Image transitions - silky smooth parallax effect
    imageOpacity: calculateOpacityWithFadeInOut(easedImageAppearProgress, easedImageFadeOutProgress),
    imageScale: 0.9 + (easedImageAppearProgress * 0.2), // Smooth scale 0.9 to 1.1
    imageTranslateY: (40 - (easedImageAppearProgress * 65)) + (25 * easedImageFadeOutProgress), // Fluid movement
    
    // Wave effect for main transition - smoother
    waveOpacity: easedImageAppearProgress * 0.35,
    waveTranslateY: 25 - (easedImageAppearProgress * 35),
    
    // Projects wave transition effect - smoother
    projectWaveOpacity: easedProjectWaveProgress * 0.35,
    projectWaveTranslateY: 25 - (easedProjectWaveProgress * 35),
    
    // Projects section with buttery smooth fade in
    projectsOpacity: easedProjectsAppearProgress,
    projectsTranslateY: 35 * (1 - easedProjectsAppearProgress), // Smooth slide up
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
 * Easing functions for ultra-smooth parallax animations
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

// Smoother easing for parallax effects
const easeOutQuart = (x: number): number => {
  return 1 - Math.pow(1 - x, 4);
};

const easeInOutQuart = (x: number): number => {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};

// Ultra-smooth easing for silky parallax
const easeOutExpo = (x: number): number => {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
