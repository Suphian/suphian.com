import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AudioPlayer from '@/shared/components/common/AudioPlayer';
import { useEventTracker } from '@/shared/hooks/useEventTracker';

const Podcast = () => {
  const navigate = useNavigate();
  const { track } = useEventTracker({
    autoTrackPageViews: true,
  });

  useEffect(() => {
    // Track page view
    track('page_view', {
      page: '/podcast',
      title: "Podcast - GenAI Solves YouTube's $20 Billion Payment Problem",
    });
  }, [track]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-xs font-mono hover:opacity-70 transition-opacity flex items-center gap-2"
          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          <span>←</span> Back
        </button>

        {/* Audio Player */}
        <div className="bg-black/50 backdrop-blur-sm border rounded-lg p-6 md:p-8" style={{ borderColor: 'rgba(255, 59, 48, 0.2)' }}>
          <AudioPlayer
            src="/assets/audio/GenAI_Solves_YouTubes_20_Billion_Payment_Problem.m4a"
            title="GenAI Solves YouTube's $20 Billion Payment Problem"
          />
        </div>

        {/* Description */}
        <div className="mt-8 text-center">
          <p className="text-xs md:text-sm font-mono opacity-60 max-w-2xl mx-auto">
            An AI-powered conversation exploring how GenAI is revolutionizing YouTube's $20 billion payment ecosystem.
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-mono px-5 py-2.5 border rounded-md transition-all duration-300 hover:scale-105 active:scale-95"
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
      </div>
    </div>
  );
};

export default Podcast;






