
-- Add internal traffic classification columns to events table
ALTER TABLE public.events 
ADD COLUMN is_internal_traffic BOOLEAN DEFAULT FALSE,
ADD COLUMN traffic_type TEXT DEFAULT 'external';

-- Create index for better query performance on traffic classification
CREATE INDEX idx_events_is_internal_traffic ON public.events(is_internal_traffic);
CREATE INDEX idx_events_traffic_type ON public.events(traffic_type);

-- Update existing events to match their session's internal status
UPDATE public.events 
SET 
  is_internal_traffic = s.is_internal_user,
  traffic_type = CASE 
    WHEN s.is_internal_user = true THEN 'internal' 
    ELSE 'external' 
  END
FROM public.sessions s 
WHERE public.events.session_id = s.session_id;
