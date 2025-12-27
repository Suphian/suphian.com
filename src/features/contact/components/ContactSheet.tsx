
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
        aria-describedby="contact-desc"
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
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContactSheet;
