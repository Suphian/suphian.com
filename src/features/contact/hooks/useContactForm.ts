
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/use-toast";
import { sanitizeInput } from "@/shared/utils/security/security";
import supabase from "@/integrations/supabase/client";

// Enhanced phone validation regex for better security
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

export const contactFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be 100 characters or less.")
    .transform(val => sanitizeInput(val, 100)),
  email: z.string()
    .email("Please enter a valid email")
    .max(160, "Email must be 160 characters or less.")
    .regex(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, "Invalid email format"),
  phone: z.string()
    .max(48, "Phone must be 48 characters or less.")
    .regex(phoneRegex, "Please enter a valid phone number (digits only, optional + prefix)")
    .optional()
    .or(z.literal("")),
  message: z.string()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message too long (max 5000 chars).")
    .transform(val => sanitizeInput(val, 5000)),
  website: z.string().max(0, "Bot submission detected.").optional(), // honeypot
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Secure rate limiting using server-side function
const checkRateLimit = async (identifier: string, action: string, maxAttempts: number = 3): Promise<boolean> => {
  try {
    const windowMinutes = 60; // 1 hour window for contact forms
    
    // Use secure server-side rate limiting function
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action: action,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes
    });

    if (error) {
      console.error('Secure rate limit check error:', error);
      return true; // Allow on error to avoid blocking legitimate users
    }

    return data === true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
};

// Test function to send a sample email with better error handling
export const sendTestEmail = async () => {
  try {
    const testData = {
      name: "Test User",
      email: "test@example.com",
      message: "This is a test message to verify the spaceman logo appears in the email.",
      source: "EmailTest"
    };

    const { data, error } = await supabase.functions.invoke("notify-contact-submit", {
      body: testData
    });

    if (error) {
      console.error("❌ Test email error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to send test email. Check that RESEND_API_KEY is configured." 
      };
    }

    // Check for warnings in response
    if (data?.warnings) {
      console.warn("⚠️ Test email warnings:", data.warnings);
      return { 
        success: true, 
        data,
        warning: data.warnings.join(", ")
      };
    }

    // Check if emails were actually sent
    const ownerEmailSent = data?.emailResponse && !data.emailResponse.error;
    const confirmEmailSent = data?.confirmEmailResponse && !data.confirmEmailResponse.error;
    
    if (!ownerEmailSent && !confirmEmailSent) {
      return { 
        success: false, 
        error: "Emails were not sent. Check RESEND_API_KEY configuration." 
      };
    }

    console.log("✅ Test email sent successfully:", {
      ownerEmail: ownerEmailSent ? "sent" : "failed",
      confirmEmail: confirmEmailSent ? "sent" : "failed"
    });
    
    return { 
      success: true, 
      data,
      ownerEmailSent,
      confirmEmailSent
    };
  } catch (error: any) {
    console.error("❌ Failed to send test email:", error);
    return { 
      success: false, 
      error: error.message || "Unexpected error while sending test email" 
    };
  }
};

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
      const clientIP = 'browser_' + (window.navigator.userAgent + window.location.href).slice(0, 50);
      const isAllowed = await checkRateLimit(clientIP, 'contact_form', 3);
      
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
        console.error('Contact form submission error:', error);
        throw error;
      }

      // Try to send notification with better error handling
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke("notify-contact-submit", {
          body: {
            ...data,
            subject: "Contact Form Submission",
            source,
          }
        });

        if (emailError) {
          console.error("❌ Email notification error:", emailError);
          // Log but don't block - form was submitted successfully
          if (import.meta.env.DEV) {
            toast({
              title: "Form submitted",
              description: "Your message was received, but email notification may have failed.",
              variant: "default",
            });
          }
        } else if (emailData?.warnings) {
          // Show warning if emails had issues but don't fail the submission
          if (import.meta.env.DEV) {
            console.warn("⚠️ Email warnings:", emailData.warnings);
          }
        } else {
          // Success - emails sent
          if (import.meta.env.DEV) {
            console.log("✅ Email notifications sent successfully");
          }
        }
      } catch (ex: any) {
        console.error("❌ Failed to call email edge function:", ex);
        // Don't throw here - form submission was successful
        // The database insert succeeded, so we show success
        if (import.meta.env.DEV) {
          toast({
            title: "Form submitted",
            description: "Your message was received, but email notification failed. Please contact directly if urgent.",
            variant: "default",
          });
        }
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      
      form.reset();
      if (onSubmitted) onSubmitted();
      
    } catch (error: any) {
      console.error("Failed to send form submission:", error);
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
