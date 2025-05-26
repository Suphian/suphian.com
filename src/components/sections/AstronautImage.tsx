
import React from "react";

const AstronautImage = () => {
  return (
    <div className="aspect-square w-full mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-lg bg-background">
      <img 
        src="/lovable-uploads/9ecd33bc-76a0-4af2-a18c-c988cab8c7e9.png" 
        alt="Astronaut wearing orange headphones" 
        className="w-full h-full object-contain object-center" 
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-transparent" />
    </div>
  );
};

export default AstronautImage;
