
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ContactForm from "./ContactForm";
import ContactChipsBar from "./ContactChipsBar";

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactSheet: React.FC<ContactSheetProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-xl md:max-w-2xl p-0 overflow-y-auto border-l-0"
        aria-modal="true"
        role="dialog"
      >
        <div className="h-full flex flex-col" tabIndex={-1}>
          <div className="p-6 md:p-8 border-b">
            <div className="flex justify-between items-center mb-2">
              <SheetTitle className="text-2xl md:text-3xl font-bold" tabIndex={0}>
                Contact
              </SheetTitle>
            </div>
            <SheetDescription className="text-base text-muted-foreground" id="contact-desc">
              Let's discuss your project or just say hello.
            </SheetDescription>
          </div>
          <div className="flex-grow p-6 md:p-8 overflow-y-auto">
            <ContactForm
              showPhone
              source="ContactSheet"
              showChips
              chipsBarComponent={<ContactChipsBar textareaId="message" />}
              onSubmitted={() => onOpenChange(false)}
              extraFields={
                <div className="mt-12 flex justify-center">
                  <img
                    src="/lovable-uploads/db2efd18-0555-427b-89b4-c5cae8a5a143.png"
                    alt="Astronaut with orange moon"
                    className="w-auto h-auto max-h-64 object-contain transform scale-130"
                    loading="lazy"
                  />
                </div>
              }
            />
          </div>
          <div className="p-6 md:p-8 border-t bg-secondary/30">
            <div className="flex space-x-4 justify-center">
              <a
                href="https://www.linkedin.com/in/suphian/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open Suphian's LinkedIn profile"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/Suphian"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open Suphian's GitHub profile"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContactSheet;
