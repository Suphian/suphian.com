
export const initializeRevealAnimations = () => {
  const revealElements = document.querySelectorAll('.reveal');
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.1 }
  );
  
  revealElements.forEach((element) => {
    observer.observe(element);
  });
  
  return () => {
    revealElements.forEach((element) => {
      observer.unobserve(element);
    });
  };
};

export const addRevealClass = (element: HTMLElement | null, delayMs: number = 0) => {
  if (!element) return;
  
  element.classList.add('reveal');
  if (delayMs > 0) {
    element.style.transitionDelay = `${delayMs}ms`;
  }
};
