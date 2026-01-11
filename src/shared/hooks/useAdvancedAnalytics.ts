/**
 * Advanced Analytics Hook
 * Tracks high-value events: form engagement, external links, copy events, errors, etc.
 */

import { useEffect, useRef, useCallback } from 'react';
import { analyticsConsole } from '@/shared/utils/analytics/consoleLogger';
import { engagementTracker } from '@/shared/utils/analytics/engagementTracker';

interface AdvancedAnalyticsOptions {
  trackFormEngagement?: boolean;
  trackExternalLinks?: boolean;
  trackCopyEvents?: boolean;
  trackErrors?: boolean;
  trackAudioEngagement?: boolean;
  trackTimeOnPage?: boolean;
  onTrack?: (eventName: string, payload: Record<string, unknown>) => void;
}

interface FormEngagementState {
  formId: string;
  startTime: number;
  fields: Map<string, { focusTime: number; blurTime?: number; changed: boolean }>;
  submitted: boolean;
}

export const useAdvancedAnalytics = (options: AdvancedAnalyticsOptions = {}) => {
  const {
    trackFormEngagement = true,
    trackExternalLinks = true,
    trackCopyEvents = true,
    trackErrors = true,
    trackAudioEngagement = true,
    trackTimeOnPage = true,
    onTrack
  } = options;

  const formStates = useRef<Map<string, FormEngagementState>>(new Map());
  const pageLoadTime = useRef(Date.now());
  const audioElements = useRef<Map<HTMLAudioElement, { startTime: number; playCount: number }>>(new Map());
  const hasTrackedExit = useRef(false);

  // Track function that logs to console and calls callback
  const track = useCallback((eventName: string, payload: Record<string, unknown> = {}) => {
    analyticsConsole.log(eventName, payload);
    onTrack?.(eventName, payload);
  }, [onTrack]);

  // Form engagement tracking
  useEffect(() => {
    if (!trackFormEngagement) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const form = target.closest('form');
      const formId = form?.id || form?.getAttribute('data-form-id') || 'unknown-form';
      const fieldName = (target as HTMLInputElement).name || target.id || 'unknown-field';

      if (!formStates.current.has(formId)) {
        formStates.current.set(formId, {
          formId,
          startTime: Date.now(),
          fields: new Map(),
          submitted: false
        });
        track('form_engagement_start', { form_id: formId });
      }

      const state = formStates.current.get(formId)!;
      state.fields.set(fieldName, {
        focusTime: Date.now(),
        changed: state.fields.get(fieldName)?.changed || false
      });

      track('form_field_focus', {
        form_id: formId,
        field_name: fieldName,
        field_type: (target as HTMLInputElement).type || target.tagName.toLowerCase()
      });
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const form = target.closest('form');
      const formId = form?.id || form?.getAttribute('data-form-id') || 'unknown-form';
      const fieldName = (target as HTMLInputElement).name || target.id || 'unknown-field';

      const state = formStates.current.get(formId);
      if (!state) return;

      const fieldState = state.fields.get(fieldName);
      if (fieldState) {
        const timeInField = Date.now() - fieldState.focusTime;
        fieldState.blurTime = Date.now();

        track('form_field_blur', {
          form_id: formId,
          field_name: fieldName,
          time_in_field_ms: timeInField,
          was_changed: fieldState.changed
        });
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const form = target.closest('form');
      const formId = form?.id || form?.getAttribute('data-form-id') || 'unknown-form';
      const fieldName = (target as HTMLInputElement).name || target.id || 'unknown-field';

      const state = formStates.current.get(formId);
      if (!state) return;

      const fieldState = state.fields.get(fieldName);
      if (fieldState && !fieldState.changed) {
        fieldState.changed = true;
        track('form_field_changed', {
          form_id: formId,
          field_name: fieldName
        });
      }
    };

    const handleSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      const formId = form.id || form.getAttribute('data-form-id') || 'unknown-form';
      const state = formStates.current.get(formId);

      if (state) {
        state.submitted = true;
        const totalTime = Date.now() - state.startTime;
        const fieldsInteracted = Array.from(state.fields.entries()).map(([name, data]) => ({
          name,
          changed: data.changed
        }));

        track('form_submitted', {
          form_id: formId,
          total_time_ms: totalTime,
          fields_count: state.fields.size,
          fields_changed: fieldsInteracted.filter(f => f.changed).length,
          fields: fieldsInteracted
        });
      }
    };

    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('submit', handleSubmit, true);

      // Track form abandonment on unmount
      formStates.current.forEach((state, formId) => {
        if (!state.submitted && state.fields.size > 0) {
          track('form_abandoned', {
            form_id: formId,
            time_spent_ms: Date.now() - state.startTime,
            fields_started: state.fields.size,
            fields_changed: Array.from(state.fields.values()).filter(f => f.changed).length
          });
        }
      });
    };
  }, [trackFormEngagement, track]);

  // External link tracking
  useEffect(() => {
    if (!trackExternalLinks) return;

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;

      const href = link.href;
      if (!href) return;

      try {
        const url = new URL(href);
        const isExternal = url.hostname !== window.location.hostname;

        if (isExternal) {
          track('external_link_click', {
            url: href,
            domain: url.hostname,
            link_text: link.textContent?.slice(0, 100),
            target: link.target || '_self'
          });
        }
      } catch {
        // Invalid URL, skip
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [trackExternalLinks, track]);

  // Copy event tracking
  useEffect(() => {
    if (!trackCopyEvents) return;

    const handleCopy = () => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 0) {
        track('text_copied', {
          text_length: selection.length,
          text_preview: selection.slice(0, 50) + (selection.length > 50 ? '...' : ''),
          page_url: window.location.pathname
        });
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [trackCopyEvents, track]);

  // Error tracking
  useEffect(() => {
    if (!trackErrors) return;

    const handleError = (e: ErrorEvent) => {
      track('javascript_error', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno,
        stack: e.error?.stack?.slice(0, 500)
      });
      analyticsConsole.logError('javascript_error', e.error || e.message, {
        filename: e.filename,
        line: e.lineno
      });
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
      track('unhandled_promise_rejection', {
        reason: reason.slice(0, 500),
        stack: e.reason?.stack?.slice(0, 500)
      });
      analyticsConsole.logError('unhandled_promise_rejection', reason);
    };

    const handleFetchError = (e: Event) => {
      if (e.type === 'error' && e.target instanceof HTMLElement) {
        const target = e.target as HTMLImageElement | HTMLScriptElement | HTMLLinkElement;
        if ('src' in target || 'href' in target) {
          track('resource_load_error', {
            element: target.tagName.toLowerCase(),
            url: ('src' in target ? target.src : (target as HTMLLinkElement).href)?.slice(0, 200)
          });
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('error', handleFetchError, true);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('error', handleFetchError, true);
    };
  }, [trackErrors, track]);

  // Audio engagement tracking
  useEffect(() => {
    if (!trackAudioEngagement) return;

    const handlePlay = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      let state = audioElements.current.get(audio);

      if (!state) {
        state = { startTime: Date.now(), playCount: 0 };
        audioElements.current.set(audio, state);
      }

      state.playCount++;
      state.startTime = Date.now();

      track('audio_play', {
        audio_src: audio.src?.split('/').pop(),
        play_count: state.playCount,
        current_time: audio.currentTime,
        duration: audio.duration
      });
    };

    const handlePause = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      const state = audioElements.current.get(audio);

      if (state) {
        const listenDuration = Date.now() - state.startTime;
        track('audio_pause', {
          audio_src: audio.src?.split('/').pop(),
          listen_duration_ms: listenDuration,
          paused_at: audio.currentTime,
          duration: audio.duration,
          percent_played: Math.round((audio.currentTime / audio.duration) * 100)
        });
      }
    };

    const handleEnded = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      const state = audioElements.current.get(audio);

      if (state) {
        track('audio_completed', {
          audio_src: audio.src?.split('/').pop(),
          play_count: state.playCount,
          duration: audio.duration
        });
      }
    };

    // Listen for all audio events
    document.addEventListener('play', handlePlay, true);
    document.addEventListener('pause', handlePause, true);
    document.addEventListener('ended', handleEnded, true);

    return () => {
      document.removeEventListener('play', handlePlay, true);
      document.removeEventListener('pause', handlePause, true);
      document.removeEventListener('ended', handleEnded, true);
    };
  }, [trackAudioEngagement, track]);

  // Time on page tracking
  useEffect(() => {
    if (!trackTimeOnPage) return;

    // Initialize engagement tracker
    engagementTracker.initialize({
      onRageClick: (data) => {
        track('rage_click', {
          clicks: data.clicks,
          element: data.element,
          x: data.x,
          y: data.y
        });
      },
      onIdleChange: (isIdle) => {
        track(isIdle ? 'user_idle' : 'user_active', {
          time_on_page_ms: Date.now() - pageLoadTime.current
        });
      },
      onEngagementMilestone: (score) => {
        track('engagement_milestone', {
          score,
          metrics: engagementTracker.getFormattedMetrics()
        });
      }
    });

    // Track time on page when leaving
    const handleBeforeUnload = () => {
      if (hasTrackedExit.current) return;
      hasTrackedExit.current = true;

      const metrics = engagementTracker.getFormattedMetrics();
      track('page_exit', {
        ...metrics,
        exit_url: document.activeElement?.tagName === 'A'
          ? (document.activeElement as HTMLAnchorElement).href
          : undefined
      });

      // Use sendBeacon for reliable tracking on page exit
      if (navigator.sendBeacon) {
        const payload = JSON.stringify({
          event: 'page_exit',
          ...metrics,
          timestamp: new Date().toISOString()
        });
        navigator.sendBeacon('/api/analytics-beacon', payload);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        track('page_hidden', {
          time_on_page_ms: Date.now() - pageLoadTime.current
        });
      } else {
        track('page_visible', {
          time_away_ms: Date.now() - pageLoadTime.current
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      engagementTracker.destroy();
    };
  }, [trackTimeOnPage, track]);

  return {
    track,
    getEngagementMetrics: () => engagementTracker.getMetrics(),
    getFormattedMetrics: () => engagementTracker.getFormattedMetrics(),
    recordSectionView: (sectionId: string) => engagementTracker.recordSectionView(sectionId)
  };
};

export default useAdvancedAnalytics;
