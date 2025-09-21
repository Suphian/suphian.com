
import React from "react";
import LazyImage from "../LazyImage";

const AstronautImage = () => {
  return (
    <div className="aspect-square w-full mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-lg bg-background">
      <LazyImage
        src="/lovable-uploads/9ecd33bc-76a0-4af2-a18c-c988cab8c7e9.png"
        webpSrc="/optimized/astronaut-headphones.webp"
        webpSrcSet="/optimized/astronaut-headphones-600.webp 600w, /optimized/astronaut-headphones.webp 1920w"
        srcSet="/lovable-uploads/9ecd33bc-76a0-4af2-a18c-c988cab8c7e9.png"
        alt="Astronaut wearing orange headphones"
        className="w-full h-full object-contain object-center"
        sizes="(max-width: 768px) 600px, 592px"
        width={592}
        height={592}
        priority="low"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
    </div>
  );
};

export default AstronautImage;
