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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-gray-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-xl">📊</span> Your Live Analytics
            </h2>
            <p className="text-xs text-gray-400 mt-1">See how you're interacting with this site</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Engagement Score */}
        <div className="px-6 py-4 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Engagement Score</span>
            <span
              className="text-2xl font-bold"
              style={{ color: getScoreColor(engagementScore) }}
            >
              {engagementScore}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${engagementScore}%`,
                backgroundColor: getScoreColor(engagementScore)
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {getScoreMessage(engagementScore)}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-white/10">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{stats.clicks}</div>
            <div className="text-xs text-gray-400">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-400">{stats.scrollDepth}%</div>
            <div className="text-xs text-gray-400">Scroll Depth</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">{stats.timeOnPage}s</div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
        </div>

        {/* Events List */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Activity Feed
          </h3>
          <div className="overflow-y-auto max-h-[200px] space-y-1">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <span className="text-2xl">👀</span>
                <p className="text-sm mt-2">Watching for your activity...</p>
                <p className="text-xs mt-1">Try scrolling, clicking, or exploring!</p>
              </div>
            ) : (
              events.map(event => {
                const config = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.custom;
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      {config.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{event.description}</p>
                      <p className="text-xs text-gray-500">{formatTime(event.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            🔒 This data is only visible to you
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveAnalyticsPanel;
