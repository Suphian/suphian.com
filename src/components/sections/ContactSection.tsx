
import React from "react";
import { ButtonCustom } from "@/components/ui/button-custom";

interface ContactSectionProps {
  onContactClick: () => void;
}

const ContactSection = ({ onContactClick }: ContactSectionProps) => {
  return (
    <section id="contact-section" className="text-center reveal">
      <h2 className="heading-lg mb-6">Let's Connect</h2>
      <p className="paragraph max-w-2xl mx-auto mb-8">
        I'm always open to discussing new projects, opportunities, or partnerships.
      </p>
      <ButtonCustom size="lg" arrowIcon onClick={onContactClick}>
        Get in Touch
      </ButtonCustom>
    </section>
  );
};

export default ContactSection;
