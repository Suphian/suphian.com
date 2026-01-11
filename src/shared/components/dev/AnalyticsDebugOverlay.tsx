/**
 * Analytics Debug Overlay
 * Visual panel showing real-time analytics events in development
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { analyticsConsole } from '@/shared/utils/analytics/consoleLogger';
import { engagementTracker } from '@/shared/utils/analytics/engagementTracker';

interface EventDisplay {
  id: string;
  timestamp: Date;
  name: string;
  category: string;
  payload: Record<string, unknown>;
}

const CATEGORY_COLORS: Record<string, string> = {
  page: '#3b82f6',
  click: '#8b5cf6',
  scroll: '#06b6d4',
  form: '#10b981',
  engagement: '#f59e0b',
  error: '#ef4444',
  timing: '#ec4899',
  custom: '#6366f1',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  page: '📄',
  click: '🖱️',
  scroll: '📜',
  form: '📝',
  engagement: '💡',
  error: '❌',
  timing: '⏱️',
  custom: '🔷',
};

export const AnalyticsDebugOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [events, setEvents] = useState<EventDisplay[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [engagementScore, setEngagementScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const eventIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const getCategory = (eventName: string): string => {
    if (eventName.includes('page') || eventName.includes('view')) return 'page';
    if (eventName.includes('click') || eventName.includes('tap')) return 'click';
    if (eventName.includes('scroll')) return 'scroll';
    if (eventName.includes('form') || eventName.includes('field') || eventName.includes('submit')) return 'form';
    if (eventName.includes('engagement') || eventName.includes('time') || eventName.includes('rage') || eventName.includes('idle') || eventName.includes('active')) return 'engagement';
    if (eventName.includes('error')) return 'error';
    if (eventName.includes('timing') || eventName.includes('duration')) return 'timing';
    return 'custom';
  };

  const addEvent = useCallback((name: string, payload: Record<string, unknown>) => {
    if (isPaused) return;

    const newEvent: EventDisplay = {
      id: `event-${++eventIdCounter.current}`,
      timestamp: new Date(),
      name,
      category: getCategory(name),
      payload
    };

    setEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, 50); // Keep last 50 events
      return updated;
    });
  }, [isPaused]);

  // Intercept analytics console logs
  useEffect(() => {
    const originalLog = analyticsConsole.log.bind(analyticsConsole);

    analyticsConsole.log = (name: string, payload: Record<string, unknown> = {}) => {
      originalLog(name, payload);
      addEvent(name, payload);
    };

    return () => {
      analyticsConsole.log = originalLog;
    };
  }, [addEvent]);

  // Update engagement score periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = engagementTracker.getMetrics();
      setEngagementScore(metrics.interactionScore);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut to toggle (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.category === filter);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPayload = (payload: Record<string, unknown>) => {
    const entries = Object.entries(payload).slice(0, 5);
    return entries.map(([key, value]) => {
      const displayValue = typeof value === 'object'
        ? JSON.stringify(value).slice(0, 30)
        : String(value).slice(0, 30);
      return `${key}: ${displayValue}`;
    }).join(', ');
  };

  // Floating trigger button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-mono"
        title="Open Analytics Debug (Ctrl+Shift+A)"
      >
        <span>📊</span>
        <span>{events.length}</span>
        <span className="text-xs text-gray-400">events</span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl font-mono text-xs overflow-hidden"
      style={{
        width: isMinimized ? '200px' : '400px',
        maxHeight: isMinimized ? '48px' : '500px',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div className="bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="font-bold">Analytics</span>
          <span className="text-gray-400">({events.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <>
              <button
                onClick={() => setIsPaused(p => !p)}
                className={`px-2 py-1 rounded text-xs ${isPaused ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? '▶️' : '⏸️'}
              </button>
              <button
                onClick={() => setEvents([])}
                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs"
                title="Clear"
              >
                🗑️
              </button>
            </>
          )}
          <button
            onClick={() => setIsMinimized(m => !m)}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs"
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-red-600 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Engagement Score Bar */}
          <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400">Engagement Score</span>
              <span className="font-bold" style={{
                color: engagementScore < 30 ? '#ef4444' :
                       engagementScore < 60 ? '#f59e0b' : '#10b981'
              }}>
                {engagementScore}/100
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${engagementScore}%`,
                  backgroundColor: engagementScore < 30 ? '#ef4444' :
                                   engagementScore < 60 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-2 py-1 bg-gray-800/30 border-b border-gray-700 flex gap-1 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded text-xs whitespace-nowrap ${filter === 'all' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
            >
              All
            </button>
            {Object.entries(CATEGORY_EMOJIS).map(([cat, emoji]) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2 py-1 rounded text-xs whitespace-nowrap ${filter === cat ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
            {filteredEvents.length === 0 ? (
              <div className="px-3 py-8 text-center text-gray-500">
                No events yet...
              </div>
            ) : (
              filteredEvents.map(event => (
                <div
                  key={event.id}
                  className="px-3 py-2 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                  title={JSON.stringify(event.payload, null, 2)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[event.category]}20`,
                        color: CATEGORY_COLORS[event.category]
                      }}
                    >
                      {CATEGORY_EMOJIS[event.category]} {event.category.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-white">
                    {event.name}
                  </div>
                  {Object.keys(event.payload).length > 0 && (
                    <div className="mt-1 text-gray-400 text-[10px] truncate">
                      {formatPayload(event.payload)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-gray-800/50 border-t border-gray-700 text-[10px] text-gray-500">
            Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+A</kbd> to toggle
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDebugOverlay;
