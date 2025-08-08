-- Ensure trigger to update sessions.updated_at when a new event arrives
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_session_timestamp'
  ) THEN
    CREATE TRIGGER trg_update_session_timestamp
    AFTER INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_timestamp();
  END IF;
END $$;

-- Improve realtime reliability (idempotent)
DO $$ BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE public.events REPLICA IDENTITY FULL';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

DO $$ BEGIN
  -- Add events table to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.events';
  END IF;
END $$;