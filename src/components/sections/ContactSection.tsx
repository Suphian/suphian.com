import React, { useState } from "react";
import { ButtonCustom } from "@/components/ui/button-custom";
import WavyUnderline from "@/components/WavyUnderline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/integrations/supabase/client";

interface ContactSectionProps {
  onContactClick: () => void;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(72, "Name must be 72 characters or less."),
  email: z.string().email("Please enter a valid email").max(160, "Email must be 160 characters or less."),
  message: z.string().min(10, "Message must be at least 10 characters").max(2500, "Message too long (max 2500 chars)."),
  website: z.string().max(0, "Bot submission detected.").optional(), // honeypot
});

type FormData = z.infer<typeof formSchema>;

const ContactSection = ({ onContactClick }: ContactSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      website: "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    if (data.website && data.website.trim().length > 0) {
      toast({
        title: "Submission blocked",
        description: "Bot detected.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contact_submissions").insert([
        {
          name: data.name,
          email: data.email,
          message: data.message,
          subject: "Contact Form Submission",
          phone: null,
        }
      ]);
      if (error) throw error;

      try {
        const { data: notifyData, error: notifyError } = await supabase.functions.invoke("notify-contact-submit", {
          body: {
            ...data,
            subject: "Contact Form Submission",
            phone: null,
            source: "ContactSectionModal"
          }
        });
        if (notifyError) {
          // Only log errors, not regular flow
          console.error("Edge function error:", notifyError);
        }
      } catch (ex) {
        // Only log errors
        console.error("Failed to call edge function from ContactSection:", ex);
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });

      form.reset();
      setIsOpen(false);
      setTimeout(() => {
        onContactClick();
      }, 250);

    } catch (error) {
      // Only log critical errors
      console.error("Failed to send form submission to Supabase:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-section" className="text-center reveal py-16 relative">
      <h2 className="heading-lg mb-6 relative inline-block">
        Let's Connect
        <WavyUnderline />
      </h2>
      <p className="paragraph max-w-2xl mx-auto mb-8">
        I'm always open to discussing new projects, opportunities, or partnerships.<br />
        <span className="font-semibold text-accent">
          To request my CV, please fill out this form and mention in your message that you're requesting my resume.
        </span>
      </p>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto wave-btn bg-primary text-background px-6 py-4 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group text-center"
        aria-haspopup="dialog"
        aria-controls="contact-dialog"
        aria-label="Open contact form dialog"
      >
        <span className="relative z-10 group-hover:text-background transition-colors duration-300">Get in Touch</span>
        <span className="absolute inset-0 bg-youtubeRed bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md" id="contact-dialog" role="dialog" aria-modal="true">
          <DialogHeader>
            <DialogTitle tabIndex={0}>Get in Touch</DialogTitle>
            <DialogDescription>
              Send me a message and I'll get back to you as soon as possible.
              <span className="block mt-1 text-accent font-medium">
                If you're requesting my CV, please mention it in your message!
              </span>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Honeypot field */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                style={{ display: 'none' }}
                {...form.register("website")}
                aria-hidden="true"
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} maxLength={72} aria-required="true" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} maxLength={160} aria-required="true" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What would you like to discuss?"
                        className="min-h-[120px]"
                        {...field}
                        maxLength={2500}
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <ButtonCustom
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  aria-label={isSubmitting ? "Sending..." : "Send Message"}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </ButtonCustom>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ContactSection;
