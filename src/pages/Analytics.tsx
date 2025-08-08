import { useEffect, useMemo, useState } from 'react';
import supabase from '@/integrations/supabase/client';

interface EventRow {
  id: string;
  event_name: string;
  page_url?: string | null;
  is_internal_traffic?: boolean | null;
  traffic_type?: string | null;
  timestamp?: string | null;
}

const Analytics = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial fetch of recent events
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, event_name, page_url, is_internal_traffic, traffic_type, timestamp, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setEvents(data as any);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload: any) => {
          const newEvent = payload.new as EventRow;
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnected(true);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    const total = events.length;
    const internal = events.filter(e => e.is_internal_traffic).length;
    const external = total - internal;
    return { total, internal, external };
  }, [events]);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Realtime Analytics</h1>
      <p className="text-muted-foreground mb-6">
        Live stream of new analytics events (last 50). Connection: {connected ? 'connected' : 'connecting...'}
      </p>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total events</div>
          <div className="text-2xl font-semibold">{counts.total}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">External</div>
          <div className="text-2xl font-semibold">{counts.external}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Internal</div>
          <div className="text-2xl font-semibold">{counts.internal}</div>
        </div>
      </section>

      <section className="space-y-3">
        {events.map((e) => (
          <article key={e.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{e.event_name}</div>
              <div className="text-xs text-muted-foreground">{e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}</div>
            </div>
            <div className="text-sm text-muted-foreground truncate">{e.page_url}</div>
            <div className="text-xs mt-1">Traffic: {e.traffic_type || (e.is_internal_traffic ? 'internal' : 'external')}</div>
          </article>
        ))}
        {events.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Waiting for new events... Generate activity by browsing the site.
          </div>
        )}
      </section>
    </main>
  );
};

export default Analytics;
