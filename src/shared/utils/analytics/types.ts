
export interface EventTrackerConfig {
  enableInDevelopment?: boolean;
  batchSize?: number;
  batchIntervalMs?: number;
  filterInternalTraffic?: boolean;
}

export interface SessionData {
  session_id: string;
  visitor_id?: string;
  visit_count?: number;
  ip_address?: string;
  location?: Record<string, unknown> | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  referrer_source?: string;
  referrer_detail?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
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
  event_payload?: Record<string, unknown>;
  timestamp: string;
  page_url?: string;
  retried?: boolean;
  is_internal_traffic?: boolean;
  traffic_type?: string;
}
