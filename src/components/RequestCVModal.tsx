
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ButtonCustom } from "@/components/ui/button-custom";
import AudioPlayer from "@/components/AudioPlayer";

interface RequestCVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetInTouch: () => void; // Now REQUIRED
}

/**
 * This modal now informs users that to request your CV,
 * they should fill out the Get in Touch form on the site.
 * The download and preview features have been removed for security.
 */
const RequestCVModal = ({ open, onOpenChange, onGetInTouch }: RequestCVModalProps) => {
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const handleGetInTouch = () => {
    onOpenChange(false);
    // Give time for modal to transition out (for UX)
    setTimeout(() => {
      onGetInTouch();
    }, 250);
  };

  const handleListenToResume = () => {
    setIsAudioModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Request My CV</DialogTitle>
            <DialogDescription>
              To request my CV, please use the "Get in Touch" form and mention you'd like to receive my resume. I'll review your request and follow up by email.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-6">
            <ButtonCustom
              variant="default"
              className="w-full"
              onClick={handleGetInTouch}
            >
              Get in Touch
            </ButtonCustom>
            <ButtonCustom
              variant="default"
              className="w-full"
              onClick={handleListenToResume}
            >
              Listen to Resume
            </ButtonCustom>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Player Modal */}
      <Dialog open={isAudioModalOpen} onOpenChange={setIsAudioModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto relative [&>button]:text-foreground [&>button]:opacity-100 [&>button]:hover:opacity-70 [&>button]:z-50 flex flex-col">
          <DialogHeader>
            <DialogTitle>Listen to Resume</DialogTitle>
            <DialogDescription>
              The Resume Reimagined - How One Leader Mastered AI, Data, and Impact Across Google, YouTube, and Beyond
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex-grow">
            <AudioPlayer 
              src="/assets/audio/The_Resume_Reimagined__How_One_Leader_Mastered_AI,_Data,_and_Impact_Across_Google,_YouTube,_and_Beyo.m4a"
              title="The Resume Reimagined"
            />
          </div>
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => setIsAudioModalOpen(false)}
              className="w-full text-sm font-mono px-6 py-4 border rounded-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                color: '#FF3B30',
                borderColor: '#FF3B30',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 10px rgba(255, 59, 48, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
                e.currentTarget.style.borderColor = '#FF5C45';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 59, 48, 0.4), 0 0 30px rgba(255, 59, 48, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = '#FF3B30';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 59, 48, 0.2)';
              }}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestCVModal;

