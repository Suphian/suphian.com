export interface VisitorData {
  visitor_id: string;
  visit_count: number;
  first_visit: string;
  last_visit: string;
}

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface ReferrerInfo {
  referrer: string;
  referrer_source: string;
  referrer_detail: string;
}

import { TrafficDetector } from './trafficDetector';

export class VisitorTracking {
  private static readonly VISITOR_KEY = 'analytics_visitor_id';
  private static readonly VISIT_COUNT_KEY = 'analytics_visit_count';
  private static readonly FIRST_VISIT_KEY = 'analytics_first_visit';
  private static readonly LAST_VISIT_KEY = 'analytics_last_visit';

  static getOrCreateVisitorData(): VisitorData {
    const existingVisitorId = localStorage.getItem(this.VISITOR_KEY);
    const visitCount = parseInt(localStorage.getItem(this.VISIT_COUNT_KEY) || '0');
    const firstVisit = localStorage.getItem(this.FIRST_VISIT_KEY);
    const _lastVisit = localStorage.getItem(this.LAST_VISIT_KEY);
    const now = new Date().toISOString();

    if (existingVisitorId && firstVisit) {
      // Returning visitor
      const newVisitCount = visitCount + 1;
      localStorage.setItem(this.VISIT_COUNT_KEY, newVisitCount.toString());
      localStorage.setItem(this.LAST_VISIT_KEY, now);
      
      return {
        visitor_id: existingVisitorId,
        visit_count: newVisitCount,
        first_visit: firstVisit,
        last_visit: now
      };
    } else {
      // New visitor
      const newVisitorId = crypto.randomUUID();
      localStorage.setItem(this.VISITOR_KEY, newVisitorId);
      localStorage.setItem(this.VISIT_COUNT_KEY, '1');
      localStorage.setItem(this.FIRST_VISIT_KEY, now);
      localStorage.setItem(this.LAST_VISIT_KEY, now);
      
      return {
        visitor_id: newVisitorId,
        visit_count: 1,
        first_visit: now,
        last_visit: now
      };
    }
  }

  static parseUTMParameters(): UTMParameters {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
    };
  }

  static analyzeReferrer(): ReferrerInfo {
    const referrer = document.referrer;
    const _currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for custom source parameters
    const customSource = urlParams.get('source');
    const isInternal = urlParams.get('internal') === 'true';
    
    if (customSource) {
      return {
        referrer: referrer || '(direct)',
        referrer_source: customSource,
        referrer_detail: `Custom source: ${customSource}`
      };
    }
    
    if (isInternal) {
      return {
        referrer: referrer || '(direct)',
        referrer_source: 'internal',
        referrer_detail: 'Internal traffic'
      };
    }
    
    if (!referrer) {
      return {
        referrer: '(direct)',
        referrer_source: 'direct',
        referrer_detail: 'Direct traffic or unknown source'
      };
    }
    
    // Analyze referrer domain
    try {
      const referrerUrl = new URL(referrer);
      const domain = referrerUrl.hostname.toLowerCase();
      
      if (domain.includes('google.com')) {
        return {
          referrer,
          referrer_source: 'google',
          referrer_detail: 'Google Search'
        };
      } else if (domain.includes('linkedin.com')) {
        return {
          referrer,
          referrer_source: 'linkedin',
          referrer_detail: 'LinkedIn'
        };
      } else if (domain.includes('twitter.com') || domain.includes('t.co')) {
        return {
          referrer,
          referrer_source: 'twitter',
          referrer_detail: 'Twitter'
        };
      } else if (domain.includes('facebook.com')) {
        return {
          referrer,
          referrer_source: 'facebook',
          referrer_detail: 'Facebook'
        };
      } else if (domain.includes('github.com')) {
        return {
          referrer,
          referrer_source: 'github',
          referrer_detail: 'GitHub'
        };
      } else {
        return {
          referrer,
          referrer_source: 'referral',
          referrer_detail: `Referral from ${domain}`
        };
      }
    } catch (error) {
      return {
        referrer,
        referrer_source: 'unknown',
        referrer_detail: 'Invalid referrer URL'
      };
    }
  }

  /**
   * @deprecated Use TrafficDetector.isInternalTraffic() instead.
   */
  static detectInternalTraffic(): boolean {
    return TrafficDetector.isInternalTraffic();
  }
}