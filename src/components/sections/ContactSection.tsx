
import React from "react";
import { ButtonCustom } from "@/components/ui/button-custom";
import WavyUnderline from "@/components/WavyUnderline";

interface ContactSectionProps {
  onContactClick: () => void;
}

const ContactSection = ({ onContactClick }: ContactSectionProps) => {
  return (
    <section id="contact-section" className="text-center reveal py-16 relative">
      <h2 className="heading-lg mb-6 relative inline-block">
        Let's Connect
        <WavyUnderline />
      </h2>
      <p className="paragraph max-w-2xl mx-auto mb-8">
        I'm always open to discussing new projects, opportunities, or partnerships.
      </p>
      <button 
        onClick={onContactClick}
        className="w-full sm:w-auto wave-btn bg-primary text-background px-6 py-4 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group text-center"
      >
        <span className="relative z-10 group-hover:text-background transition-colors duration-300">Get in Touch</span>
        <span className="absolute inset-0 bg-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
      </button>
    </section>
  );
};

export default ContactSection;
