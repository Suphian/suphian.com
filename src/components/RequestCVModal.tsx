
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ButtonCustom } from "@/components/ui/button-custom";

interface RequestCVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * This modal now informs users that to request your CV,
 * they should fill out the Get in Touch form on the site.
 * The download and preview features have been removed for security.
 */
const RequestCVModal = ({ open, onOpenChange }: RequestCVModalProps) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle>Request My CV</DialogTitle>
          <DialogDescription>
            To request my CV, please use the "Get in Touch" form and mention you'd like to receive my resume. I'll review your request and follow up by email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6">
          <ButtonCustom
            variant="outline"
            className="w-full"
            onClick={handleClose}
          >
            Close
          </ButtonCustom>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestCVModal;
