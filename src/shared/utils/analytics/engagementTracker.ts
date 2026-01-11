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
      interactionScore: 0
    };
  }

  initialize(callbacks?: {
    onRageClick?: EngagementTracker['onRageClick'];
    onIdleChange?: EngagementTracker['onIdleChange'];
    onEngagementMilestone?: EngagementTracker['onEngagementMilestone'];
  }): void {
    if (callbacks) {
      this.onRageClick = callbacks.onRageClick;
      this.onIdleChange = callbacks.onIdleChange;
      this.onEngagementMilestone = callbacks.onEngagementMilestone;
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
    const elementDesc = target.tagName + (target.className ? `.${target.className.split(' ')[0]}` : '');

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
    const now = Date.now();
    this.metrics.totalTimeMs = now - this.startTime;
    this.metrics.activeTimeMs = this.activeTimeAccumulator;
    this.metrics.idleTimeMs = this.idleTimeAccumulator;
    this.metrics.interactionScore = this.calculateEngagementScore();

    // Check for engagement milestones
    const score = this.metrics.interactionScore;
    if (score >= 25 && score < 50) {
      this.onEngagementMilestone?.(25);
    } else if (score >= 50 && score < 75) {
      this.onEngagementMilestone?.(50);
    } else if (score >= 75) {
      this.onEngagementMilestone?.(75);
    }
  }

  calculateEngagementScore(): number {
    // Weighted engagement score (0-100)
    const weights = {
      activeTimeRatio: 25,  // Up to 25 points for active time ratio
      scrollDepth: 20,      // Up to 20 points for scroll depth
      clicks: 15,           // Up to 15 points for clicks
      sections: 20,         // Up to 20 points for sections viewed
      timeOnPage: 20        // Up to 20 points for time on page
    };

    let score = 0;

    // Active time ratio (active time / total time)
    const activeRatio = this.metrics.totalTimeMs > 0
      ? this.metrics.activeTimeMs / this.metrics.totalTimeMs
      : 0;
    score += Math.min(activeRatio * weights.activeTimeRatio, weights.activeTimeRatio);

    // Scroll depth
    score += (this.metrics.scrollDepthMax / 100) * weights.scrollDepth;

    // Click engagement (cap at 10 clicks for full points)
    const clickScore = Math.min(this.metrics.clickCount / 10, 1);
    score += clickScore * weights.clicks;

    // Sections viewed (cap at 5 sections for full points)
    const sectionScore = Math.min(this.metrics.sectionViews.size / 5, 1);
    score += sectionScore * weights.sections;

    // Time on page (30 seconds for full points)
    const timeScore = Math.min(this.metrics.totalTimeMs / 30000, 1);
    score += timeScore * weights.timeOnPage;

    // Penalty for rage clicks (frustration indicator)
    if (this.metrics.rageClickCount > 0) {
      score *= (1 - (this.metrics.rageClickCount * 0.05)); // 5% penalty per rage click
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  recordSectionView(sectionId: string): void {
    this.metrics.sectionViews.add(sectionId);
    this.recordActivity();
    analyticsConsole.log('section_viewed', { sectionId, totalSections: this.metrics.sectionViews.size });
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
      engagement_score: metrics.interactionScore
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
