/**
 * Live Analytics Panel
 * User-facing panel showing real-time analytics as they browse
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { engagementTracker } from '@/shared/utils/analytics/engagementTracker';
import { VisitorTracking } from '@/shared/utils/analytics/visitorTracking';

interface EventDisplay {
  id: string;
  timestamp: Date;
  name: string;
  category: string;
  description: string;
}

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  page: { emoji: '📄', color: '#3b82f6', label: 'Page View' },
  click: { emoji: '🖱️', color: '#8b5cf6', label: 'Click' },
  scroll: { emoji: '📜', color: '#06b6d4', label: 'Scroll' },
  form: { emoji: '📝', color: '#10b981', label: 'Form' },
  engagement: { emoji: '💡', color: '#f59e0b', label: 'Engagement' },
  audio: { emoji: '🔊', color: '#ec4899', label: 'Audio' },
  custom: { emoji: '✨', color: '#6366f1', label: 'Action' },
};

// 8-bit celebration animation component
const PixelCelebration = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {/* Pixel confetti */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#FF3B30', '#FF5C45', '#FF8C7A', '#FFF'][Math.floor(Math.random() * 4)],
            animation: `pixelFall ${1 + Math.random() * 2}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
            imageRendering: 'pixelated',
          }}
        />
      ))}

      {/* Center trophy */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-bounce">
        <div className="text-4xl mb-2" style={{ imageRendering: 'pixelated' }}>🏆</div>
        <div
          className="text-xs font-mono font-bold px-2 py-1 bg-[#FF3B30] text-white"
          style={{ imageRendering: 'pixelated' }}
        >
          100%!
        </div>
      </div>

      {/* Pixel sparkles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-white"
          style={{
            left: `${20 + (i * 10)}%`,
            top: `${30 + Math.sin(i) * 20}%`,
            animation: `pixelSparkle 0.5s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
            boxShadow: '0 0 4px #FF3B30',
          }}
        />
      ))}

      <style>{`
        @keyframes pixelFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(360deg); opacity: 0; }
        }
        @keyframes pixelSparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(2); }
        }
      `}</style>
    </div>
  );
};

// Human-readable event descriptions
const getEventDescription = (name: string, payload: Record<string, unknown>): string => {
  switch (name) {
    case 'page_view':
      return `Viewed ${payload.title || 'page'}`;
    case 'scroll_milestone':
      return `Scrolled to ${payload.milestone}% of the page`;
    case 'button_click':
      return `Clicked "${(payload.buttonText as string)?.slice(0, 20) || 'button'}"`;
    case 'element_click':
      return `Clicked on ${payload.action || 'element'}`;
    case 'form_engagement_start':
      return 'Started filling out a form';
    case 'form_field_focus':
      return `Focused on ${payload.field_name || 'field'}`;
    case 'form_submitted':
      return 'Submitted the form';
    case 'form_abandoned':
      return 'Left the form incomplete';
    case 'external_link_click':
      return `Clicked link to ${payload.domain || 'external site'}`;
    case 'text_copied':
      return 'Copied some text';
    case 'audio_play':
      return 'Started playing audio';
    case 'audio_pause':
      return 'Paused audio';
    case 'audio_completed':
      return 'Finished listening to audio';
    case 'rage_click':
      return '😤 Rapid clicking detected!';
    case 'user_idle':
      return 'Taking a break...';
    case 'user_active':
      return 'Back to browsing!';
    case 'engagement_milestone':
      return `Engagement score hit ${payload.score}!`;
    case 'section_viewed':
      return `Viewing ${payload.sectionId || 'section'}`;
    default:
      return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const getCategory = (eventName: string): string => {
  if (eventName.includes('page') || eventName.includes('view')) return 'page';
  if (eventName.includes('click') || eventName.includes('tap')) return 'click';
  if (eventName.includes('scroll')) return 'scroll';
  if (eventName.includes('form') || eventName.includes('field') || eventName.includes('submit')) return 'form';
  if (eventName.includes('audio')) return 'audio';
  if (eventName.includes('engagement') || eventName.includes('idle') || eventName.includes('active') || eventName.includes('rage')) return 'engagement';
  return 'custom';
};

interface LiveAnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveAnalyticsPanel = ({ isOpen, onClose }: LiveAnalyticsPanelProps) => {
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [engagementScore, setEngagementScore] = useState(0);
  const [stats, setStats] = useState({ clicks: 0, scrollDepth: 0, timeOnPage: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const eventIdCounter = useRef(0);
  const hasShownCelebration = useRef(false);

  // Get visitor info once on mount
  const visitorInfo = useMemo(() => {
    const referrerInfo = VisitorTracking.analyzeReferrer();
    const visitorData = VisitorTracking.getOrCreateVisitorData();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      source: referrerInfo.referrer_source,
      sourceDetail: referrerInfo.referrer_detail,
      visitCount: visitorData.visit_count,
      timezone,
      isReturning: visitorData.visit_count > 1
    };
  }, []);

  const addEvent = useCallback((name: string, payload: Record<string, unknown>) => {
    // Skip internal/debug events
    if (name.startsWith('_') || name.includes('pending') || name.includes('tracker')) return;

    const newEvent: EventDisplay = {
      id: `event-${++eventIdCounter.current}`,
      timestamp: new Date(),
      name,
      category: getCategory(name),
      description: getEventDescription(name, payload)
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 30));
  }, []);

  // Listen for analytics events
  useEffect(() => {
    if (!isOpen) return;

    // Import and intercept analytics console
    import('@/shared/utils/analytics/consoleLogger').then(({ analyticsConsole }) => {
      const originalLog = analyticsConsole.log.bind(analyticsConsole);

      analyticsConsole.log = (name: string, payload: Record<string, unknown> = {}) => {
        originalLog(name, payload);
        addEvent(name, payload);
      };

      return () => {
        analyticsConsole.log = originalLog;
      };
    });
  }, [isOpen, addEvent]);

  // Update engagement metrics
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const metrics = engagementTracker.getMetrics();
      setEngagementScore(metrics.interactionScore);
      setStats({
        clicks: metrics.clickCount,
        scrollDepth: metrics.scrollDepthMax,
        timeOnPage: Math.round(metrics.totalTimeMs / 1000)
      });

      // Trigger celebration at 100%
      if (metrics.interactionScore >= 100 && !hasShownCelebration.current) {
        hasShownCelebration.current = true;
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Red branding color scale (oxide red theme)
  const getScoreColor = (score: number) => {
    if (score < 25) return '#8B2020'; // Dark oxide red
    if (score < 50) return '#B84040'; // Oxide red
    if (score < 75) return '#D45050'; // Lighter red
    if (score < 100) return '#FF5C45'; // Bright red
    return '#FF3B30'; // Full engagement red
  };

  const getScoreMessage = (score: number) => {
    if (score < 25) return "Just getting started...";
    if (score < 50) return "Warming up!";
    if (score < 75) return "Getting engaged!";
    if (score < 100) return "Almost there!";
    return "FULL ENGAGEMENT!";
  };

  return (
    <>
      {/* Backdrop - clickable to close but transparent */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className="fixed top-0 right-0 h-full z-[9999] w-80 bg-black/95 backdrop-blur-xl text-white shadow-2xl border-l border-[hsl(0,60%,45%)]/20 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 8-bit celebration at 100% */}
        <PixelCelebration show={showCelebration} />

        {/* Header */}
        <div className="px-4 py-3 border-b border-[hsl(0,60%,45%)]/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Your Activity
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">Live session tracking</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[hsl(0,60%,45%)]/10 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Visitor Info */}
        <div className="px-4 py-2 border-b border-[hsl(0,60%,45%)]/10 flex-shrink-0">
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">From:</span>
              <span className="text-[#FF5C45] font-medium capitalize">
                {visitorInfo.source === 'direct' ? 'Direct' : visitorInfo.sourceDetail}
              </span>
            </div>
            <div className="w-px h-3 bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Visit:</span>
              <span className="text-white">
                #{visitorInfo.visitCount}
                {visitorInfo.isReturning && <span className="text-[#FF5C45] ml-1">returning</span>}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px]">
            <span className="text-gray-600">📍</span>
            <span className="text-gray-500">{visitorInfo.timezone}</span>
          </div>
        </div>

        {/* Engagement Score */}
        <div className="px-4 py-3 bg-[hsl(0,60%,45%)]/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Engagement</span>
            <span
              className="text-lg font-bold font-mono"
              style={{ color: getScoreColor(engagementScore) }}
            >
              {engagementScore}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${engagementScore}%`,
                backgroundColor: getScoreColor(engagementScore)
              }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 text-center">
            {getScoreMessage(engagementScore)}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-[hsl(0,60%,45%)]/10 flex-shrink-0">
          <div className="text-center">
            <div className="text-base font-bold font-mono text-blue-400">{stats.clicks}</div>
            <div className="text-[10px] text-gray-500">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold font-mono text-cyan-400">{stats.scrollDepth}%</div>
            <div className="text-[10px] text-gray-500">Scroll</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold font-mono text-purple-400">{stats.timeOnPage}s</div>
            <div className="text-[10px] text-gray-500">Time</div>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 flex-shrink-0">
            Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto px-2">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-xs">Watching for activity...</p>
                <p className="text-[10px] mt-1 text-gray-600">Scroll, click, or explore</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {events.map(event => {
                  const config = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.custom;
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-[hsl(0,60%,45%)]/5 transition-colors"
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: `${config.color}15` }}
                      >
                        {config.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/90 truncate">{event.description}</p>
                        <p className="text-[10px] text-gray-600">{formatTime(event.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[hsl(0,60%,45%)]/5 border-t border-[hsl(0,60%,45%)]/10 text-center flex-shrink-0">
          <p className="text-[10px] text-gray-600">
            This data is only visible to you
          </p>
        </div>
      </div>
    </>
  );
};

export default LiveAnalyticsPanel;
