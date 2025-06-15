import { useState, useEffect, FormEvent } from "react";
import { Mail, Linkedin, Github } from "lucide-react";
import { initializeRevealAnimations } from "@/lib/animations";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import supabase from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contact_submissions").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
        }
      ]);
      if (error) {
        throw error;
      }

      // Edge function call for notification
      fetch("https://ujughujunixnwlmtdsxd.supabase.co/functions/v1/notify-contact-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "ContactPage",
        })
      }).catch(() => {});

      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error("Failed to send form submission to Supabase:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24">
      <div className="container-custom">
        <div className="flex flex-col items-center text-center mb-16 reveal">
          <span className="tag mb-4">Get in Touch</span>
          <h1 className="heading-xl max-w-3xl text-balance mb-6">
            Let's Discuss Your Project
          </h1>
          <p className="paragraph max-w-2xl">
            I'm always interested in new opportunities, collaborations, and 
            discussions about AI and payment innovations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="reveal" style={{ transitionDelay: "150ms" }}>
            <form onSubmit={handleSubmit} className="bg-card p-6 md:p-8 rounded-xl border max-w-[600px] mx-auto w-full">
              <h2 className="heading-md mb-6">Send Me a Message</h2>
              
              <div className="space-y-6 mb-6">
                <div className="form-group">
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Your Name <span className="text-accent">*</span>
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full border ${errors.name ? 'border-accent' : 'focus:border-accent'} bg-background h-12 transition-colors`}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm font-medium text-accent">{errors.name}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Your Email <span className="text-accent">*</span>
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`w-full border ${errors.email ? 'border-accent' : 'focus:border-accent'} bg-background h-12 transition-colors`}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm font-medium text-accent">{errors.email}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-muted-foreground text-xs">(Optional)</span>
                  </label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full border focus:border-accent bg-background h-12 transition-colors"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject <span className="text-accent">*</span>
                  </label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className={`w-full border ${errors.subject ? 'border-accent' : 'focus:border-accent'} bg-background h-12 transition-colors`}
                    aria-invalid={!!errors.subject}
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm font-medium text-accent">{errors.subject}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Your Message <span className="text-accent">*</span>
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Hey, what's up? Talk to me. Whether you're looking for a referral, have a new opportunity, or just want to chat tech, I'm open to collaborating or connecting."
                    rows={5}
                    className={`w-full border ${errors.message ? 'border-accent' : 'focus:border-accent'} bg-background min-h-[120px] transition-colors`}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm font-medium text-accent">{errors.message}</p>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="wave-btn bg-accent text-white w-full h-14 px-6 py-3 rounded-md font-montserrat font-bold transition-all duration-300 relative overflow-hidden group"
                disabled={isSubmitting}
              >
                <span className="relative z-10 group-hover:text-black transition-colors duration-300 slide-up">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </span>
                <span className="absolute inset-0 bg-primary bg-[length:200%] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
              </button>
              
              <div className="mt-12 flex justify-center">
                <img 
                  src="/lovable-uploads/db2efd18-0555-427b-89b4-c5cae8a5a143.png" 
                  alt="Astronaut with orange moon" 
                  className="w-auto h-auto max-h-64 object-contain transform scale-130"
                />
              </div>
            </form>
          </div>

          <div className="reveal" style={{ transitionDelay: "300ms" }}>
            <div className="bg-secondary/30 p-6 md:p-8 rounded-xl">
              <h2 className="heading-md mb-6">Contact Information</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-4 mt-1 text-accent" />
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <a 
                      href="mailto:suph.tweel@gmail.com" 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      suph.tweel@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Linkedin className="h-5 w-5 mr-4 mt-1 text-accent" />
                  <div>
                    <h3 className="font-medium mb-1">LinkedIn</h3>
                    <a 
                      href="https://www.linkedin.com/in/suphian/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      linkedin.com/in/suphian
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Github className="h-5 w-5 mr-4 mt-1 text-accent" />
                  <div>
                    <h3 className="font-medium mb-1">GitHub</h3>
                    <a 
                      href="https://github.com/Suphian" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      github.com/Suphian
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl border border-muted flex items-center justify-center">
                <img 
                  src="/lovable-uploads/db2efd18-0555-427b-89b4-c5cae8a5a143.png" 
                  alt="Astronaut with orange moon" 
                  className="w-auto h-auto max-h-64 object-contain transform scale-130"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
