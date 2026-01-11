/**
 * Live Analytics Panel
 * User-facing panel showing real-time analytics as they browse
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { engagementTracker } from '@/shared/utils/analytics/engagementTracker';

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
  const eventIdCounter = useRef(0);

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

  const getScoreColor = (score: number) => {
    if (score < 30) return '#ef4444';
    if (score < 60) return '#f59e0b';
    return '#10b981';
  };

  const getScoreMessage = (score: number) => {
    if (score < 20) return "Just getting started...";
    if (score < 40) return "Warming up!";
    if (score < 60) return "Getting engaged!";
    if (score < 80) return "Really exploring!";
    return "Super engaged! 🎉";
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
