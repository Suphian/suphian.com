
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
  const { toast } = useToast();
  
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
      await emailjs.send(
        'service_xre6x5d', // Your EmailJS service ID
        'template_98hg4qw', // Your EmailJS template ID
        templateParams, 
        'GR73acsP9JjNBN84T' // Updated EmailJS user ID
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
  
  return (
    <section id="contact-section" className="py-16 md:py-24 bg-background">
      <div className="container-custom">
        <div className="text-center mb-16">
          <span className="tag mb-4">Contact</span>
          <h2 className="heading-xl mb-6">Get in Touch</h2>
          <p className="paragraph max-w-2xl mx-auto">
            Have a project in mind or want to chat about AI and payment innovations? I'm always open to new opportunities and collaborations.
          </p>
        </div>
        
        <div className="flex justify-center">
          <ButtonCustom 
            onClick={() => setIsOpen(true)}
            className="bg-primary text-background px-8 py-4 text-lg"
          >
            Send me a message
          </ButtonCustom>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send me a message</DialogTitle>
              <DialogDescription>
                Fill out the form below and I'll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell me about your project or inquiry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <ButtonCustom 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="bg-primary text-background"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </ButtonCustom>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default ContactSection;
