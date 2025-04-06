
import React from "react";
import { X } from "lucide-react";
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
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type FormValues = z.infer<typeof formSchema>;

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactSheet: React.FC<ContactSheetProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    // Simulate form submission with a delay
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      form.reset();
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 overflow-y-auto border-l-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 md:p-8 border-b">
            <div className="flex justify-between items-center mb-2">
              <SheetTitle className="text-2xl md:text-3xl font-bold">Contact</SheetTitle>
              <SheetClose className="rounded-full p-2 hover:bg-secondary transition-colors">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
            <SheetDescription className="text-base text-muted-foreground">
              Let's discuss your project or just say hello.
            </SheetDescription>
          </div>
          
          {/* Form */}
          <div className="flex-grow p-6 md:p-8 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium mb-2.5">Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your name" 
                            {...field} 
                            className="h-12 rounded-none border-b border-t-0 border-l-0 border-r-0 px-0 bg-transparent focus-visible:ring-0 focus-visible:border-primary" 
                          />
                        </FormControl>
                        <FormMessage className="mt-2" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium mb-2.5">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your.email@example.com" 
                            {...field} 
                            className="h-12 rounded-none border-b border-t-0 border-l-0 border-r-0 px-0 bg-transparent focus-visible:ring-0 focus-visible:border-primary" 
                          />
                        </FormControl>
                        <FormMessage className="mt-2" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium mb-2.5">Subject</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What is this regarding?" 
                          {...field} 
                          className="h-12 rounded-none border-b border-t-0 border-l-0 border-r-0 px-0 bg-transparent focus-visible:ring-0 focus-visible:border-primary" 
                        />
                      </FormControl>
                      <FormMessage className="mt-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium mb-2.5">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your message here..." 
                          className="min-h-[150px] rounded-none border-b border-t-0 border-l-0 border-r-0 px-0 bg-transparent focus-visible:ring-0 focus-visible:border-primary resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="mt-2" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-14 mt-6 bg-accent text-white hover:bg-accent/90 text-base transition-all duration-300"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Footer with contact details */}
          <div className="p-6 md:p-8 border-t bg-secondary/30">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Email</h3>
                <a href="mailto:suph.tweel@gmail.com" className="text-accent hover:underline">
                  suph.tweel@gmail.com
                </a>
              </div>
              
              <div className="flex space-x-4">
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContactSheet;
