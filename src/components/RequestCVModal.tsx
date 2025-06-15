
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ButtonCustom } from "@/components/ui/button-custom";
import { useToast } from "@/hooks/use-toast";
import emailjs from 'emailjs-com';

interface RequestCVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RequestCVModal = ({ open, onOpenChange }: RequestCVModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [showDownloaded, setShowDownloaded] = useState(false);

  const handleDownload = async () => {
    setIsSubmitting(true);
    try {
      // Send notification that CV was downloaded
      await emailjs.send(
        'service_xre6x5d',
        'template_98hg4qw',
        {
          email: "cv-downloaded@portfolio.com", // Generic identifier
          message: "CV downloaded by someone",
        },
        'GR73acsP9JjNBN84T'
      );
      // Download the CV
      const link = document.createElement('a');
      link.href = "/lovable-uploads/c8903b52-a5cf-463d-af25-b89f7e2d25f0.png";
      link.download = "Suphian_Tweel_CV.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowDownloaded(true);
      toast({
        title: "Download started!",
        description: "Your CV is being downloaded.",
      });
    } catch (error) {
      console.error("Error sending download notification:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowDownloaded(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download My CV</DialogTitle>
          <DialogDescription>
            {!showDownloaded
              ? "Click the button below to download my CV. If you experience issues, please contact me via LinkedIn."
              : "Thank you! If you have further questions, feel free to reach out."}
          </DialogDescription>
        </DialogHeader>

        {!showDownloaded ? (
          <div className="flex flex-col items-center space-y-6">
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
                disabled={isSubmitting}
              >
                Close
              </ButtonCustom>
              <ButtonCustom
                className="flex-1"
                onClick={handleDownload}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Loading..." : "Download CV"}
              </ButtonCustom>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <img
              src="/lovable-uploads/c8903b52-a5cf-463d-af25-b89f7e2d25f0.png"
              alt="CV Preview"
              className="w-full max-h-60 object-cover object-top rounded-md border"
            />
            <ButtonCustom
              variant="outline"
              className="w-full"
              onClick={handleClose}
            >
              Close
            </ButtonCustom>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestCVModal;

