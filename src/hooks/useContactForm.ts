
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

export function useContactForm({
  showPhone = false,
  source,
  onSubmitted,
}: {
  showPhone?: boolean;
  source: string;
  onSubmitted?: () => void;
}) {
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

  return {
    form,
    isSubmitting,
    onSubmit,
  };
}

