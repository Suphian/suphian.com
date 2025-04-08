import React, { useState } from "react";
import { ButtonCustom } from "@/components/ui/button-custom";
import WavyUnderline from "@/components/WavyUnderline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import emailjs from 'emailjs-com';
interface ContactSectionProps {
  onContactClick: () => void;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters")
});
type FormData = z.infer<typeof formSchema>;
const ContactSection = ({
  onContactClick
}: ContactSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  });
  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Replace these parameters with your own EmailJS details
      const templateParams = {
        name: data.name,
        email: data.email,
        message: data.message
      };

      // Send email using EmailJS with updated user ID
      await emailjs.send('service_xre6x5d',
      // Your EmailJS service ID
      'template_98hg4qw',
      // Your EmailJS template ID
      templateParams, 'GR73acsP9JjNBN84T' // Updated EmailJS user ID
      );
      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon."
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return;
};
export default ContactSection;