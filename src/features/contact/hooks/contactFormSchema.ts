/**
 * Contact form validation schema and types.
 */

import { z } from "zod";
import { sanitizeInput } from "@/shared/utils/security/security";

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

export const defaultFormValues: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};
