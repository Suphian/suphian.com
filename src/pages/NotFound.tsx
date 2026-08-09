import { Link } from "react-router-dom";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const NotFound = () => {
  const reduceMotion = prefersReducedMotion();

  return (
    <div className="relative z-10 flex flex-col items-center justify-center py-24">
      <div className="w-64 aspect-square overflow-hidden">
        <video
          autoPlay={!reduceMotion}
          loop
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          className="w-full h-full object-cover object-top"
        >
          <source src="/suph-logo-animation.mp4" type="video/mp4" />
        </video>
      </div>

      <p className="text-xl mt-10 mb-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        This page doesn't exist.
      </p>
      <Link
        to="/"
        className="text-sm text-white/40 hover:text-white/80 underline underline-offset-4 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
