
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/integrations/supabase/client";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(72, "Name must be 72 characters or less."),
  email: z.string().email("Please enter a valid email").max(160, "Email must be 160 characters or less."),
  phone: z.string().max(48, "Phone must be 48 characters or less.").regex(
      /^(\+?\d{1,4}[\s-]?)?((\(\d{3,}\))|\d{3,})[\s-]?\d{3,}[\s-]?\d{4,}$/,
      "Please enter a valid phone number."
    ).optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters.").max(2500, "Message too long (max 2500 chars)."),
  website: z.string().max(0, "Bot submission detected.").optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  // Only show phone if true
  showPhone?: boolean;
  source: string;
  onSubmitted?: () => void;
  showChips?: boolean;
  chipsBarComponent?: React.ReactNode;
  extraFields?: React.ReactNode;
  submitButton?: React.ReactNode;
}

const ContactForm: React.FC<ContactFormProps> = ({
  showPhone = false,
  source,
  onSubmitted,
  showChips,
  chipsBarComponent,
  extraFields,
  submitButton,
}) => {
  const { toast } = useToast();
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      website: "",
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: ContactFormData) => {
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
          phone: showPhone ? data.phone || null : null,
          subject: "Contact Form Submission",
          message: data.message,
        }
      ]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("notify-contact-submit", {
          body: {
            ...data,
            subject: "Contact Form Submission",
            source,
          }
        });
      } catch (ex) {
        // Only log errors
        console.error("Failed to call edge function:", ex);
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      form.reset();
      if (onSubmitted) onSubmitted();
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-[600px] mx-auto" aria-labelledby="contact-desc">
        {/** honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
          {...form.register("website")}
          aria-hidden="true"
        />
        {/* Name */}
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Name <span className="text-accent">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    {...field}
                    className="h-12 border focus:border-accent transition-colors"
                    maxLength={72}
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage className="text-accent" />
              </FormItem>
            )}
        />
        {/* Email */}
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Email <span className="text-accent">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    {...field}
                    className="h-12 border focus:border-accent transition-colors"
                    maxLength={160}
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage className="text-accent" />
              </FormItem>
            )}
        />
        {/* Phone */}
        {showPhone && (
        <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Phone Number <span className="text-muted-foreground text-xs">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...field}
                    className="h-12 border focus:border-accent transition-colors"
                    maxLength={48}
                    pattern="^(\+?\\d{1,4}[\\s-]?)?((\\(\\d{3,}\\))|\\d{3,})[\\s-]?\\d{3,}[\\s-]?\\d{4,}$"
                  />
                </FormControl>
                <FormMessage className="text-accent" />
              </FormItem>
            )}
        />
        )}
        {/* Message */}
        <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Message <span className="text-accent">*</span>
                </FormLabel>
                <FormControl>
                  <>
                    <Textarea
                      {...field}
                      id="message"
                      placeholder="Hey, what's up? Talk to me."
                      className="min-h-[120px] border focus:border-accent resize-none"
                      maxLength={2500}
                      aria-required="true"
                    />
                    {showChips && chipsBarComponent}
                  </>
                </FormControl>
                <FormMessage className="text-accent" />
              </FormItem>
            )}
        />
        {extraFields}
        {submitButton ? submitButton : (
          <button
            type="submit"
            className="wave-btn bg-accent text-white w-full h-14 mt-8 px-6 py-3 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            aria-label={isSubmitting ? "Sending..." : "Send Message"}
          >
            <span className="relative z-10 group-hover:text-black transition-colors duration-300 slide-up">
              {isSubmitting ? "Sending..." : "Send Message"}
            </span>
            <span className="absolute inset-0 bg-primary bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
          </button>
        )}
      </form>
    </Form>
  );
};

export default ContactForm;
