/**
 * Contact form hook - main composition of form logic.
 *
 * Split from original 279-line file into focused modules:
 * - contactFormSchema.ts - Validation schema and types
 * - useRateLimiting.ts - Rate limiting utilities
 * - useContactEmailService.ts - Email notification service
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/use-toast";
import supabase from "@/integrations/supabase/client";
import { formLogger } from "@/shared/utils/logging";

import { contactFormSchema, type ContactFormData, defaultFormValues } from "./contactFormSchema";
import { checkRateLimit, generateClientIdentifier } from "./useRateLimiting";
import { sendTestEmail, sendContactNotification } from "./useContactEmailService";

// Re-export for backward compatibility
export { contactFormSchema, type ContactFormData } from "./contactFormSchema";
export { sendTestEmail } from "./useContactEmailService";

interface UseContactFormOptions {
  showPhone?: boolean;
  source: string;
  onSubmitted?: () => void;
}

export function useContactForm({
  showPhone = false,
  source,
  onSubmitted,
}: UseContactFormOptions) {
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultFormValues
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Honeypot check
      if (data.website && data.website.trim().length > 0) {
        toast({
          title: "Submission blocked",
          description: "Bot detected.",
          variant: "destructive",
        });
        return;
      }

      // Rate limiting check
      const clientId = generateClientIdentifier();
      const isAllowed = await checkRateLimit(clientId, 'contact_form', 3);

      if (!isAllowed) {
        toast({
          title: "Too many submissions",
          description: "Please wait before submitting again.",
          variant: "destructive",
        });
        return;
      }

      // Submit to database
      const { error } = await supabase.from("contact_submissions").insert([
        {
          name: data.name,
          email: data.email,
          phone: showPhone ? data.phone || null : null,
          subject: "Contact Form Submission",
          message: data.message,
        }
      ]);

      if (error) {
        formLogger.error('Contact form submission error:', error);
        throw error;
      }

      // Send email notification (don't block on failure)
      const emailResult = await sendContactNotification({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        source,
      });

      if (!emailResult.success) {
        formLogger.warn('Email notification failed but form submitted:', emailResult.error);
        if (import.meta.env.DEV) {
          toast({
            title: "Form submitted",
            description: "Your message was received, but email notification may have failed.",
            variant: "default",
          });
        }
      } else if (emailResult.warning && import.meta.env.DEV) {
        formLogger.warn('Email notification warnings:', emailResult.warning);
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });

      form.reset();
      if (onSubmitted) onSubmitted();

    } catch (error) {
      formLogger.error("Failed to send form submission:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const testEmail = async () => {
    const result = await sendTestEmail();

    if (result.success) {
      const details = [];
      if (result.ownerEmailSent) details.push("Owner notification sent");
      if (result.confirmEmailSent) details.push("Confirmation email sent");

      toast({
        title: "Test email sent!",
        description: result.warning
          ? `${result.warning}. Check your email to verify.`
          : details.length > 0
          ? `${details.join(" and ")}. Check your email to see if the spaceman logo appears correctly.`
          : "Check your email to see if the spaceman logo appears correctly.",
      });
    } else {
      toast({
        title: "Test email failed",
        description: result.error || "Could not send test email. Please check RESEND_API_KEY configuration.",
        variant: "destructive",
      });
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
    testEmail,
  };
}
