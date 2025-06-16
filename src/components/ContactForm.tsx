
import React from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContactForm, ContactFormData } from "@/hooks/useContactForm";

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
  const { form, isSubmitting, onSubmit } = useContactForm({ showPhone, source, onSubmitted });

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
                          const COUNT_OF_MONTE_CRISTO_QUOTES = [
                            "Until the day when God will deign to reveal the future to man, all human wisdom is contained in these two words: Wait and Hope.",
                            "There is neither happiness nor misery in the world; there is only the comparison of one state with another, nothing more.",
                            "All human wisdom is summed up in two words - wait and hope."
                          ];
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
                        <span className="chip" data-text="Hey! I'd love to discuss a potential collaboration." tabIndex={0} role="button">
                          Collaboration
                        </span>
                        <span className="chip" data-text="Hi! I'm interested in learning more about your work and experience." tabIndex={0} role="button">
                          Learn More
                        </span>
                        <span className="chip" data-text="Hello! I'd like to explore potential opportunities to work together." tabIndex={0} role="button">
                          Opportunities
                        </span>
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
