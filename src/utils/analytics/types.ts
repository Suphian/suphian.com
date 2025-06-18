
export interface EventTrackerConfig {
  enableInDevelopment?: boolean;
  batchSize?: number;
  batchIntervalMs?: number;
  filterInternalTraffic?: boolean;
}

export interface SessionData {
  session_id: string;
  ip_address?: string;
  location?: any;
  browser?: string;
  os?: string;
  device_type?: string;
  screen_width?: number;
  screen_height?: number;
  viewport_width?: number;
  viewport_height?: number;
  timezone?: string;
  locale?: string;
  referrer?: string;
  landing_url?: string;
  user_agent?: string;
  is_internal_user?: boolean;
}

export interface EventData {
  session_id: string;
  event_name: string;
  event_payload?: any;
  timestamp: string;
  page_url?: string;
  retried?: boolean;
}
