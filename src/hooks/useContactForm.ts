
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/integrations/supabase/client";

// Enhanced phone validation regex for better security
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(72, "Name must be 72 characters or less."),
  email: z.string().email("Please enter a valid email").max(160, "Email must be 160 characters or less."),
  phone: z.string()
    .max(48, "Phone must be 48 characters or less.")
    .regex(phoneRegex, "Please enter a valid phone number (digits only, optional + prefix)")
    .optional()
    .or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters.").max(2500, "Message too long (max 2500 chars)."),
  website: z.string().max(0, "Bot submission detected.").optional(), // honeypot
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Rate limiting helper
const checkRateLimit = async (identifier: string, action: string, maxAttempts: number = 5) => {
  try {
    // Clean up old rate limit records first
    await supabase.rpc('cleanup_old_rate_limits');
    
    // Check current attempts
    const { data: rateLimits, error } = await supabase
      .from('rate_limits')
      .select('attempts')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Rate limit check error:', error);
      return true; // Allow on error to avoid blocking legitimate users
    }

    if (rateLimits && rateLimits.attempts >= maxAttempts) {
      return false; // Rate limited
    }

    // Record this attempt
    await supabase.from('rate_limits').upsert({
      identifier,
      action,
      attempts: rateLimits ? rateLimits.attempts + 1 : 1,
      window_start: rateLimits ? undefined : new Date().toISOString()
    });

    return true; // Allowed
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow on error
  }
};

// Test function to send a sample email
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
      console.error("Test email error:", error);
      return { success: false, error: error.message };
    }

    console.log("Test email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send test email:", error);
    return { success: false, error: error.message };
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

      // Try to send notification
      try {
        await supabase.functions.invoke("notify-contact-submit", {
          body: {
            ...data,
            subject: "Contact Form Submission",
            source,
          }
        });
      } catch (ex) {
        console.error("Failed to call edge function:", ex);
        // Don't throw here - form submission was successful
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
      toast({
        title: "Test email sent!",
        description: "Check your email to see if the spaceman logo appears correctly.",
      });
    } else {
      toast({
        title: "Test email failed",
        description: result.error || "Could not send test email.",
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
