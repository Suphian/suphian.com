
-- Create sessions table to track user sessions with metadata
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  location JSONB, -- Will store country, region, city, etc.
  browser TEXT,
  os TEXT,
  device_type TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  timezone TEXT,
  locale TEXT,
  referrer TEXT,
  landing_url TEXT,
  user_agent TEXT,
  is_internal_user BOOLEAN DEFAULT FALSE
);

-- Create events table to track all user events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_payload JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at);
CREATE INDEX idx_sessions_is_internal ON public.sessions(is_internal_user);
CREATE INDEX idx_events_session_id ON public.events(session_id);
CREATE INDEX idx_events_event_name ON public.events(event_name);
CREATE INDEX idx_events_timestamp ON public.events(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access for tracking (since this is analytics data)
CREATE POLICY "Allow public access to sessions" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Allow public access to events" ON public.events FOR ALL USING (true);

-- Function to update session updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.sessions 
  SET updated_at = NOW() 
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session timestamp when new events are added
CREATE TRIGGER update_session_on_event
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_timestamp();
