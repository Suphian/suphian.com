import React from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useContactForm, ContactFormData } from "@/features/contact/hooks/useContactForm";
import { COUNT_OF_MONTE_CRISTO_QUOTES, chipOptions } from "@/features/contact/utils/contactFormConstants";

interface ContactFormProps {
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
  const { form, isSubmitting, onSubmit, testEmail } = useContactForm({ showPhone, source, onSubmitted });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-[600px] mx-auto" aria-labelledby="contact-desc">
        {/* honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
          {...form.register("website")}
          aria-hidden="true"
        />
        
        {/* Test Email Button - only show in development */}
        {import.meta.env.DEV && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <button
              type="button"
              onClick={testEmail}
              className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-600 transition-colors"
            >
              🧪 Send Test Email
            </button>
            <p className="text-sm text-yellow-700 mt-2">
              Development only: Click to test the email with spaceman logo
            </p>
          </div>
        )}

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
                    {showChips && (
                      <div className="chips mt-2" onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (!target.classList.contains("chip")) return;

                        let newValue: string | undefined;
                        if (target.textContent === "Random") {
                          const idx = Math.floor(Math.random() * COUNT_OF_MONTE_CRISTO_QUOTES.length);
                          const quote = COUNT_OF_MONTE_CRISTO_QUOTES[idx];
                          const authorLine = "Alexandre Dumas, Count of Monte Cristo";
                          newValue = `"${quote}"\n— ${authorLine}`;
                        } else {
                          newValue = target.getAttribute("data-text") || "";
                        }

                        if (typeof newValue === "string") {
                          field.onChange(newValue);
                        }
                      }}>
                        {chipOptions.map(opt => (
                          <span
                            className="chip"
                            data-text={opt.text}
                            key={opt.label}
                            tabIndex={0}
                            role="button"
                          >
                            {opt.label}
                          </span>
                        ))}
                        <span className="chip" tabIndex={0} role="button">Random</span>
                      </div>
                    )}
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
            className="wave-btn bg-accent text-white w-full h-14 mt-6 px-6 py-3 rounded-md font-bold transition-all duration-300 relative overflow-hidden group"
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
