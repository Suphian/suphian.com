-- Ensure safe, explicit RLS policies for anonymous inserts to fix violations
-- Sessions: make session_id default robust (idempotent) and allow anon/authenticated inserts explicitly
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'session_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.sessions ALTER COLUMN session_id SET DEFAULT gen_random_uuid()';
  END IF;
END $$;

-- Events: allow NULL session_id for resiliency (idempotent)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'session_id'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.events ALTER COLUMN session_id DROP NOT NULL';
    EXCEPTION WHEN others THEN
      -- ignore if already nullable
      NULL;
    END;
  END IF;
END $$;

-- Drop existing generic insert policies (names may vary); drop-if-exists to avoid duplicates
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sessions' AND policyname='Allow anonymous session inserts') THEN
    EXECUTE 'DROP POLICY "Allow anonymous session inserts" ON public.sessions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Allow anonymous event inserts') THEN
    EXECUTE 'DROP POLICY "Allow anonymous event inserts" ON public.events';
  END IF;
END $$;

-- Create explicit insert policies for both anon and authenticated roles
CREATE POLICY "Public can insert sessions"
ON public.sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can insert events"
ON public.events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep reads admin-only as-is; no change needed
-- Optional: tighten updates on sessions to admin only (safer)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sessions' AND policyname='Allow session updates') THEN
    EXECUTE 'DROP POLICY "Allow session updates" ON public.sessions';
  END IF;
END $$;

CREATE POLICY "Admins can update sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));