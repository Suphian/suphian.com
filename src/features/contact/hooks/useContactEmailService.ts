/**
 * Email notification service for contact form submissions.
 */

import supabase from "@/integrations/supabase/client";
import { formLogger } from "@/shared/utils/logging";

export interface EmailResult {
  success: boolean;
  error?: string;
  warning?: string;
  ownerEmailSent?: boolean;
  confirmEmailSent?: boolean;
  data?: Record<string, unknown>;
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject?: string;
  source?: string;
}

/**
 * Send contact notification email to owner and confirmation to user.
 */
export async function sendContactNotification(data: ContactEmailData): Promise<EmailResult> {
  try {
    const { data: emailData, error: emailError } = await supabase.functions.invoke("notify-contact-submit", {
      body: {
        ...data,
        subject: data.subject || "Contact Form Submission",
      }
    });

    if (emailError) {
      formLogger.error("Email notification error:", emailError);
      return {
        success: false,
        error: emailError.message || "Failed to send email notification"
      };
    }

    if (emailData?.warnings) {
      formLogger.warn("Email warnings:", emailData.warnings);
      return {
        success: true,
        warning: emailData.warnings.join(", "),
        data: emailData
      };
    }

    const ownerEmailSent = emailData?.emailResponse && !emailData.emailResponse.error;
    const confirmEmailSent = emailData?.confirmEmailResponse && !emailData.confirmEmailResponse.error;

    return {
      success: true,
      ownerEmailSent,
      confirmEmailSent,
      data: emailData
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unexpected error while sending email";
    formLogger.error("Failed to send email notification:", error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send a test email to verify email configuration.
 */
export async function sendTestEmail(): Promise<EmailResult> {
  const testData: ContactEmailData = {
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message to verify the spaceman logo appears in the email.",
    source: "EmailTest"
  };

  try {
    const { data, error } = await supabase.functions.invoke("notify-contact-submit", {
      body: testData
    });

    if (error) {
      formLogger.error("Test email error:", error);
      return {
        success: false,
        error: error.message || "Failed to send test email. Check that RESEND_API_KEY is configured."
      };
    }

    // Check for warnings in response
    if (data?.warnings) {
      formLogger.warn("Test email warnings:", data.warnings);
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

    formLogger.info("Test email sent successfully:", {
      ownerEmail: ownerEmailSent ? "sent" : "failed",
      confirmEmail: confirmEmailSent ? "sent" : "failed"
    });

    return {
      success: true,
      data,
      ownerEmailSent,
      confirmEmailSent
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unexpected error while sending test email";
    formLogger.error("Failed to send test email:", error);
    return {
      success: false,
      error: errorMessage
    };
  }
}
