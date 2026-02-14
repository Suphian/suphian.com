const NotFound = () => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center py-24">
      <div className="w-64 aspect-square overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-top"
        >
          <source src="/suph-logo-animation.mp4" type="video/mp4" />
        </video>
      </div>

      <p className="text-xl mt-10 mb-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        This page doesn't exist.
      </p>
      <a
        href="/"
        className="text-sm text-white/40 hover:text-white/80 underline underline-offset-4 transition-colors"
      >
        Go Home
      </a>
    </div>
  );
};

export default NotFound;
