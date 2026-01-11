/**
 * Engagement Tracker
 * Tracks user engagement metrics: time on page, active time, rage clicks, etc.
 */

import { analyticsConsole } from './consoleLogger';

interface EngagementMetrics {
  totalTimeMs: number;
  activeTimeMs: number;
  idleTimeMs: number;
  scrollDepthMax: number;
  clickCount: number;
  rageClickCount: number;
  keyPressCount: number;
  mouseMovements: number;
  sectionViews: Set<string>;
  interactionScore: number;
  // New meaningful engagement metrics
  externalLinkClicked: boolean;
  audioPlayed: boolean;
  ctaClicked: boolean;
}

interface RageClickData {
  x: number;
  y: number;
  timestamp: number;
  element: string;
}

type EngagementCallback = (metrics: EngagementMetrics) => void;

class EngagementTracker {
  private metrics: EngagementMetrics;
  private startTime: number;
  private lastActivityTime: number;
  private idleThresholdMs = 30000; // 30 seconds of inactivity = idle
  private idleCheckInterval: ReturnType<typeof setInterval> | null = null;
  private isIdle = false;
  private activeTimeAccumulator = 0;
  private idleTimeAccumulator = 0;

  // Rage click detection
  private recentClicks: RageClickData[] = [];
  private rageClickThreshold = 3; // 3+ clicks in rapid succession
  private rageClickTimeWindow = 1000; // within 1 second
  private rageClickProximity = 50; // within 50px

  // Callbacks
  private onRageClick?: (data: { clicks: number; element: string; x: number; y: number }) => void;
  private onIdleChange?: (isIdle: boolean) => void;
  private onEngagementMilestone?: (score: number) => void;
  private onFullEngagement?: () => void;

  // Guard against recursive updateMetrics calls
  private isUpdatingMetrics = false;
  private firedMilestones = new Set<number>();

  constructor() {
    this.startTime = Date.now();
    this.lastActivityTime = this.startTime;
    this.metrics = this.createInitialMetrics();
  }

  private createInitialMetrics(): EngagementMetrics {
    return {
      totalTimeMs: 0,
      activeTimeMs: 0,
      idleTimeMs: 0,
      scrollDepthMax: 0,
      clickCount: 0,
      rageClickCount: 0,
      keyPressCount: 0,
      mouseMovements: 0,
      sectionViews: new Set(),
      interactionScore: 0,
      externalLinkClicked: false,
      audioPlayed: false,
      ctaClicked: false
    };
  }

  initialize(callbacks?: {
    onRageClick?: EngagementTracker['onRageClick'];
    onIdleChange?: EngagementTracker['onIdleChange'];
    onEngagementMilestone?: EngagementTracker['onEngagementMilestone'];
    onFullEngagement?: EngagementTracker['onFullEngagement'];
  }): void {
    if (callbacks) {
      this.onRageClick = callbacks.onRageClick;
      this.onIdleChange = callbacks.onIdleChange;
      this.onEngagementMilestone = callbacks.onEngagementMilestone;
      this.onFullEngagement = callbacks.onFullEngagement;
    }

    // Start idle detection
    this.idleCheckInterval = setInterval(() => this.checkIdleState(), 5000);

    // Listen for activity events
    this.setupActivityListeners();

    analyticsConsole.log('engagement_tracker_initialized', {
      idleThreshold: this.idleThresholdMs,
      rageClickThreshold: this.rageClickThreshold
    });
  }

  private setupActivityListeners(): void {
    // Track mouse movements (throttled)
    let lastMouseMove = 0;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseMove > 1000) { // Throttle to once per second
        this.recordActivity();
        this.metrics.mouseMovements++;
        lastMouseMove = now;
      }
    };

    // Track clicks
    const handleClick = (e: MouseEvent) => {
      this.recordActivity();
      this.metrics.clickCount++;
      this.detectRageClick(e);
    };

    // Track key presses
    const handleKeyPress = () => {
      this.recordActivity();
      this.metrics.keyPressCount++;
    };

    // Track scroll
    let lastScrollRecord = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollRecord > 500) {
        this.recordActivity();
        const scrollPercent = this.calculateScrollPercent();
        if (scrollPercent > this.metrics.scrollDepthMax) {
          this.metrics.scrollDepthMax = scrollPercent;
        }
        lastScrollRecord = now;
      }
    };

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.markIdle();
      } else {
        this.recordActivity();
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('keydown', handleKeyPress, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store cleanup function
    (this as any).cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  private recordActivity(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    if (this.isIdle) {
      // Was idle, now active
      this.idleTimeAccumulator += timeSinceLastActivity;
      this.isIdle = false;
      this.onIdleChange?.(false);
      analyticsConsole.log('user_became_active', {
        idleDuration: timeSinceLastActivity
      });
    } else if (timeSinceLastActivity < this.idleThresholdMs) {
      // Still active, accumulate active time
      this.activeTimeAccumulator += timeSinceLastActivity;
    }

    this.lastActivityTime = now;
    this.updateMetrics();
  }

  private markIdle(): void {
    if (!this.isIdle) {
      this.isIdle = true;
      this.onIdleChange?.(true);
      analyticsConsole.log('user_became_idle', {
        activeTime: this.activeTimeAccumulator
      });
    }
  }

  private checkIdleState(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    if (!this.isIdle && timeSinceLastActivity >= this.idleThresholdMs) {
      this.markIdle();
    }

    this.updateMetrics();
  }

  private detectRageClick(e: MouseEvent): void {
    const now = Date.now();
    const target = e.target as HTMLElement;
    // Handle SVG elements where className is SVGAnimatedString, not a string
    const className = typeof target.className === 'string' ? target.className : target.className?.baseVal || '';
    const elementDesc = target.tagName + (className ? `.${className.split(' ')[0]}` : '');

    const clickData: RageClickData = {
      x: e.clientX,
      y: e.clientY,
      timestamp: now,
      element: elementDesc
    };

    // Remove old clicks outside time window
    this.recentClicks = this.recentClicks.filter(
      click => now - click.timestamp < this.rageClickTimeWindow
    );

    // Check for rage clicks (multiple rapid clicks in same area)
    const nearbyClicks = this.recentClicks.filter(click => {
      const distance = Math.sqrt(
        Math.pow(click.x - e.clientX, 2) + Math.pow(click.y - e.clientY, 2)
      );
      return distance < this.rageClickProximity;
    });

    this.recentClicks.push(clickData);

    if (nearbyClicks.length >= this.rageClickThreshold - 1) {
      this.metrics.rageClickCount++;

      const rageData = {
        clicks: nearbyClicks.length + 1,
        element: elementDesc,
        x: e.clientX,
        y: e.clientY
      };

      analyticsConsole.log('rage_click_detected', rageData);
      this.onRageClick?.(rageData);

      // Clear recent clicks to avoid duplicate detection
      this.recentClicks = [];
    }
  }

  private calculateScrollPercent(): number {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;
    return maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
  }

  private updateMetrics(): void {
    // Guard against recursive calls
    if (this.isUpdatingMetrics) return;
    this.isUpdatingMetrics = true;

    try {
      const now = Date.now();
      this.metrics.totalTimeMs = now - this.startTime;
      this.metrics.activeTimeMs = this.activeTimeAccumulator;
      this.metrics.idleTimeMs = this.idleTimeAccumulator;
      this.metrics.interactionScore = this.calculateEngagementScore();

      // Check for engagement milestones (only fire once per milestone)
      const score = this.metrics.interactionScore;
      if (score >= 100 && !this.firedMilestones.has(100)) {
        this.firedMilestones.add(100);
        this.onEngagementMilestone?.(100);
        this.onFullEngagement?.();
      } else if (score >= 75 && !this.firedMilestones.has(75)) {
        this.firedMilestones.add(75);
        this.onEngagementMilestone?.(75);
      } else if (score >= 50 && !this.firedMilestones.has(50)) {
        this.firedMilestones.add(50);
        this.onEngagementMilestone?.(50);
      } else if (score >= 25 && !this.firedMilestones.has(25)) {
        this.firedMilestones.add(25);
        this.onEngagementMilestone?.(25);
      }
    } finally {
      this.isUpdatingMetrics = false;
    }
  }

  calculateEngagementScore(): number {
    /**
     * Meaningful engagement score (0-100)
     * 100% = read the entire page + spent meaningful time + any interaction
     *
     * Scoring breakdown:
     * - 50 points: Full scroll depth (read entire page to bottom)
     * - 35 points: Time on page (at least 30 seconds = meaningful engagement)
     * - 15 points: Any interaction (external link, audio, CTA, or sections)
     */
    let score = 0;

    // 50 points: Scroll depth - completing the page is the most important
    // 95%+ scroll counts as "read entire page"
    const scrollScore = this.metrics.scrollDepthMax >= 95
      ? 50
      : (this.metrics.scrollDepthMax / 95) * 50;
    score += scrollScore;

    // 35 points: Time on page (30 seconds for full points)
    const timeScore = Math.min(this.metrics.totalTimeMs / 30000, 1) * 35;
    score += timeScore;

    // 15 points: Any meaningful interaction (pick the best one)
    if (this.metrics.audioPlayed) {
      score += 15; // Best: listened to audio
    } else if (this.metrics.externalLinkClicked) {
      score += 15; // Great: explored external links
    } else if (this.metrics.ctaClicked) {
      score += 15; // Great: clicked CTA
    } else if (this.metrics.sectionViews.size >= 2) {
      score += 10; // Good: viewed multiple sections
    } else if (this.metrics.clickCount >= 3) {
      score += 5; // Some engagement: clicked around
    }

    // Small penalty for rage clicks (frustration indicator)
    if (this.metrics.rageClickCount > 0) {
      score *= (1 - (this.metrics.rageClickCount * 0.03)); // 3% penalty per rage click
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  recordSectionView(sectionId: string): void {
    this.metrics.sectionViews.add(sectionId);
    this.recordActivity();
    analyticsConsole.log('section_viewed', { sectionId, totalSections: this.metrics.sectionViews.size });
  }

  recordExternalLinkClick(): void {
    if (!this.metrics.externalLinkClicked) {
      this.metrics.externalLinkClicked = true;
      this.recordActivity();
      analyticsConsole.log('external_link_engagement', { first_click: true });
    }
  }

  recordAudioPlay(): void {
    if (!this.metrics.audioPlayed) {
      this.metrics.audioPlayed = true;
      this.recordActivity();
      analyticsConsole.log('audio_engagement', { first_play: true });
    }
  }

  recordCtaClick(): void {
    if (!this.metrics.ctaClicked) {
      this.metrics.ctaClicked = true;
      this.recordActivity();
      analyticsConsole.log('cta_engagement', { first_click: true });
    }
  }

  getMetrics(): EngagementMetrics {
    this.updateMetrics();
    return {
      ...this.metrics,
      sectionViews: new Set(this.metrics.sectionViews) // Return copy
    };
  }

  getFormattedMetrics(): Record<string, unknown> {
    const metrics = this.getMetrics();
    return {
      total_time_seconds: Math.round(metrics.totalTimeMs / 1000),
      active_time_seconds: Math.round(metrics.activeTimeMs / 1000),
      idle_time_seconds: Math.round(metrics.idleTimeMs / 1000),
      scroll_depth_max: metrics.scrollDepthMax,
      click_count: metrics.clickCount,
      rage_click_count: metrics.rageClickCount,
      key_press_count: metrics.keyPressCount,
      sections_viewed: Array.from(metrics.sectionViews),
      engagement_score: metrics.interactionScore,
      external_link_clicked: metrics.externalLinkClicked,
      audio_played: metrics.audioPlayed,
      cta_clicked: metrics.ctaClicked
    };
  }

  destroy(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }
    (this as any).cleanup?.();

    analyticsConsole.log('engagement_session_ended', this.getFormattedMetrics());
  }
}

// Export singleton
export const engagementTracker = new EngagementTracker();
export default engagementTracker;
