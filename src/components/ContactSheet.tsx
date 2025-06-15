import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
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
import supabase from "@/integrations/supabase/client";
import ContactChipsBar from "./ContactChipsBar";

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(72, "Name must be 72 characters or less."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .max(160, "Email must be 160 characters or less."),
  phone: z
    .string()
    .max(48, "Phone must be 48 characters or less.")
    .regex(
      /^(\+?\d{1,4}[\s-]?)?((\(\d{3,}\))|\d{3,})[\s-]?\d{3,}[\s-]?\d{4,}$/,
      "Please enter a valid phone number."
    )
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(2500, "Message too long (max 2500 chars)."),
  website: z.string().max(0, "Bot submission detected.").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNT_OF_MONTE_CRISTO_QUOTES = [
  "All human wisdom is contained in these two words – Wait and Hope.",
  "How did I escape? With difficulty. How did I plan this moment? With pleasure.",
  "He who has felt the deepest grief is best able to experience supreme happiness.",
  "I am not proud, but I am happy; and happiness blinds, I think, more than pride.",
  "Hatred is blind, rage carries you away, and he who pours out vengeance runs the risk of tasting a bitter draught.",
  "Life is a storm, my young friend. You will bask in the sunlight one moment, be shattered on the rocks the next.",
  "In prosperity prudence, in adversity patience.",
  "Your life story is in your own hands; mold it wisely.",
  "I have not led a wise life, but I have often been saved by a kind word or a warm smile.",
];

const chipOptions = [
  {
    label: "Referral request",
    text: "I'd love a referral for your team – here’s a bit about me…"
  },
  {
    label: "Job opportunity",
    text: "We have a PM opening that seems aligned with your background. Are you open to chat?"
  },
  {
    label: "Tech chat",
    text: "I saw your talk on payments infrastructure and would like to exchange ideas on data modeling."
  }
];

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
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 overflow-y-auto border-l-0">
        <div className="h-full flex flex-col">
          <div className="p-6 md:p-8 border-b">
            <div className="flex justify-between items-center mb-2">
              <SheetTitle className="text-2xl md:text-3xl font-bold">Contact</SheetTitle>
            </div>
            <SheetDescription className="text-base text-muted-foreground">
              Let's discuss your project or just say hello.
            </SheetDescription>
          </div>
          <div className="flex-grow p-6 md:p-8 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-[600px] mx-auto">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: 'none' }}
                  {...form.register("website")}
                />
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
                        />
                      </FormControl>
                      <FormMessage className="text-accent" />
                    </FormItem>
                  )}
                />

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
                        />
                      </FormControl>
                      <FormMessage className="text-accent" />
                    </FormItem>
                  )}
                />

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
                          pattern="^(\+?\d{1,4}[\s-]?)?((\(\d{3,}\))|\d{3,})[\s-]?\d{3,}[\s-]?\d{4,}$"
                        />
                      </FormControl>
                      <FormMessage className="text-accent" />
                    </FormItem>
                  )}
                />

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
                            placeholder="Hey, what's up? Talk to me. Whether you're looking for a referral, have a new opportunity, or just want to chat tech, I'm open to collaborating or connecting."
                            className="min-h-[150px] border focus:border-accent resize-none"
                            maxLength={2500}
                          />
                          <ContactChipsBar textareaId="message" onChange={field.onChange} value={field.value} />
                        </>
                      </FormControl>
                      <FormMessage className="text-accent" />
                    </FormItem>
                  )}
                />

                <button 
                  type="submit" 
                  className="wave-btn bg-accent text-white w-full h-14 mt-8 px-6 py-3 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group"
                  disabled={form.formState.isSubmitting}
                >
                  <span className="relative z-10 group-hover:text-black transition-colors duration-300 slide-up">
                    {form.formState.isSubmitting ? "Sending..." : "Send Message"}
                  </span>
                  <span className="absolute inset-0 bg-primary bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                </button>
                
                <div className="mt-12 flex justify-center">
                  <img 
                    src="/lovable-uploads/db2efd18-0555-427b-89b4-c5cae8a5a143.png" 
                    alt="Astronaut with orange moon" 
                    className="w-auto h-auto max-h-64 object-contain transform scale-130"
                  />
                </div>
              </form>
            </Form>
          </div>
          <div className="p-6 md:p-8 border-t bg-secondary/30">
            <div className="flex space-x-4 justify-center">
              <a 
                href="https://www.linkedin.com/in/suphian/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
              <a 
                href="https://github.com/Suphian"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
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
