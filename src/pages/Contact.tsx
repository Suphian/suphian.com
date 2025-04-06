
import { useState, useEffect, FormEvent } from "react";
import { Mail, Linkedin, Github } from "lucide-react";
import { initializeRevealAnimations } from "@/lib/animations";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const cleanup = initializeRevealAnimations();
    return cleanup;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="pt-28 pb-24">
      <div className="container-custom">
        {/* Header */}
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
          {/* Contact Form */}
          <div className="reveal" style={{ transitionDelay: "150ms" }}>
            <form onSubmit={handleSubmit} className="bg-card p-6 md:p-8 rounded-xl border">
              <h2 className="heading-md mb-6">Send Me a Message</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
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
            </form>
          </div>

          {/* Contact Info */}
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
                  src="/lovable-uploads/a5335e4d-afe3-4493-99db-7da1ad064428.png" 
                  alt="Astronaut illustration" 
                  className="max-h-48 object-contain"
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
