/**
 * Analytics Module
 * Central export for all analytics utilities
 */

// Core tracking
export { secureEventTracker, default as tracker } from './secureEventTracker';
export { SessionManager } from './sessionManager';
export { EventBatcher } from './eventBatcher';

// Console & debugging
export { analyticsConsole } from './consoleLogger';

// Engagement tracking
export { engagementTracker } from './engagementTracker';

// Validation & sanitization
export { EventValidator } from './eventValidator';
export { EventSanitizer } from './eventSanitizer';

// Traffic detection
export { TrafficDetector, getTrafficType, isInternalTraffic } from './trafficDetector';

// Metadata collection
export { MetadataService } from './metadataService';

// Visitor tracking
export { VisitorTracking } from './visitorTracking';

// Attribution
export { Attribution } from './attribution';

// Types
export type { EventData, SessionData, EventTrackerConfig } from './types';
