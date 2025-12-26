import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AudioPlayer from '@/components/AudioPlayer';
import { useEventTracker } from '@/hooks/useEventTracker';

const Podcast = () => {
  const navigate = useNavigate();
  const { track } = useEventTracker({
    autoTrackPageViews: true,
  });

  useEffect(() => {
    // Track page view
    track('page_view', {
      page: '/podcast',
      title: 'Podcast - The Resume Reimagined',
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
            src="/assets/audio/The_Resume_Reimagined__How_One_Leader_Mastered_AI,_Data,_and_Impact_Across_Google,_YouTube,_and_Beyo.m4a"
            title="The Resume Reimagined"
          />
        </div>

        {/* Description */}
        <div className="mt-8 text-center">
          <p className="text-xs md:text-sm font-mono opacity-60 max-w-2xl mx-auto">
            An AI-powered conversation exploring career journey, leadership principles, and the intersection of technology and impact.
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate(-1)}
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
      </div>
    </div>
  );
};

export default Podcast;






