import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ContactForm from "./ContactForm";
import ContactChipsBar from "./ContactChipsBar";
import { useContactForm, contactFormSchema, ContactFormData } from "@/hooks/useContactForm";
import { chipOptions } from "@/utils/contactFormConstants";

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactSheet: React.FC<ContactSheetProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const form = useForm<FormValues & { website?: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      website: "",
    },
  });

  const onSubmit = async (data: FormValues & { website?: string }) => {
    try {
      if (data.website && data.website.trim().length > 0) {
        toast({
          title: "Submission blocked",
          description: "Bot detected.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase.from("contact_submissions").insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          subject: "Contact Form Submission",
          message: data.message,
        }
      ]);
      if (error) throw error;
      try {
        const { data: notifyData, error: notifyError } = await supabase.functions.invoke("notify-contact-submit", {
          body: {
            ...data,
            subject: "Contact Form Submission",
            source: "ContactSheet",
          },
        });
        if (notifyError) {
          console.error("Edge function error:", notifyError);
        }
      } catch (ex) {
        console.error("Failed to call edge function from ContactSheet:", ex);
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to send form submission to Supabase:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

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
