
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import emailjs from 'emailjs-com';

interface RequestCVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const RequestCVModal = ({ open, onOpenChange }: RequestCVModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [validatedEmail, setValidatedEmail] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setPasswordError("");
    
    // Check password
    if (data.password !== "spacesuit6367") {
      setPasswordError("Incorrect password. Please try again or contact me via LinkedIn.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Send email notification using EmailJS
      await emailjs.send(
        'service_xre6x5d',
        'template_98hg4qw',
        {
          email: data.email,
          message: "CV requested",
        },
        'GR73acsP9JjNBN84T'
      );
      
      toast({
        title: "Verification Successful!",
        description: "Your CV is ready to download.",
      });
      
      setValidatedEmail(data.email);
      setShowDownload(true);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Send notification that CV was downloaded
      await emailjs.send(
        'service_xre6x5d',
        'template_98hg4qw',
        {
          email: validatedEmail,
          message: `CV downloaded by ${validatedEmail}`,
        },
        'GR73acsP9JjNBN84T'
      );
      
      // Create a link to download the CV
      const link = document.createElement('a');
      link.href = "/lovable-uploads/c8903b52-a5cf-463d-af25-b89f7e2d25f0.png";
      link.download = "Suphian_Tweel_CV.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error sending download notification:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    setValidatedEmail("");
    setShowDownload(false);
    setPasswordError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request My CV</DialogTitle>
          <DialogDescription>
            {!showDownload ? 
              "Please enter your email and the password to access my CV." : 
              "Thank you! You can now download my CV."
            }
          </DialogDescription>
        </DialogHeader>
        
        {!showDownload ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        type="email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter password" 
                        type="password" 
                        {...field} 
                      />
                    </FormControl>
                    {passwordError && (
                      <p className="text-sm font-medium text-destructive">{passwordError}</p>
                    )}
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <ButtonCustom 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Verifying..." : "Access CV"}
                </ButtonCustom>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <img 
              src="/lovable-uploads/c8903b52-a5cf-463d-af25-b89f7e2d25f0.png" 
              alt="CV Preview" 
              className="w-full max-h-60 object-cover object-top rounded-md border" 
            />
            
            <div className="flex gap-4 w-full">
              <ButtonCustom
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Close
              </ButtonCustom>
              
              <ButtonCustom
                className="flex-1"
                onClick={handleDownload}
              >
                Download CV
              </ButtonCustom>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestCVModal;
