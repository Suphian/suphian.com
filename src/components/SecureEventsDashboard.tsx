
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import supabase from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface Session {
  id: string;
  session_id: string;
  created_at: string;
  ip_address: string;
  location: any;
  browser: string;
  os: string;
  is_internal_user: boolean;
  landing_url: string;
}

interface Event {
  id: string;
  session_id: string;
  event_name: string;
  event_payload: any;
  timestamp: string;
  page_url: string;
}

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export const SecureEventsDashboard: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch sessions (admin only)
  const { data: sessions = [], isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Session[];
    },
    enabled: isAdmin
  });

  // Fetch events for selected session (admin only)
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('session_id', selectedSessionId)
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!selectedSessionId && isAdmin
  });

  const handleSignIn = async () => {
    window.location.href = '/auth';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert className="max-w-md mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to access the analytics dashboard.
          </AlertDescription>
        </Alert>
        <div className="text-center mt-4">
          <Button onClick={handleSignIn}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Admin privileges required to view analytics data.
          </AlertDescription>
        </Alert>
        <div className="text-center mt-4">
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  // Show error if sessions failed to load
  if (sessionsError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Secure Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Admin-only access to website analytics and user sessions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">Admin: {user.email}</Badge>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recent Sessions ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {sessionsLoading ? (
              <div>Loading sessions...</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedSessionId === session.session_id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedSessionId(session.session_id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={session.is_internal_user ? 'destructive' : 'default'}>
                        {session.is_internal_user ? 'Internal' : 'External'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div><strong>IP:</strong> {session.ip_address}</div>
                      <div><strong>Browser:</strong> {session.browser}</div>
                      <div><strong>OS:</strong> {session.os}</div>
                      {session.location && (
                        <div><strong>Location:</strong> {session.location.city}, {session.location.country}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              Session Events {selectedSessionId && `(${events.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {!selectedSessionId ? (
              <div className="text-center text-muted-foreground py-8">
                Select a session to view events
              </div>
            ) : eventsLoading ? (
              <div>Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No events found for this session
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="p-3 rounded-md border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{event.event_name}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      {event.page_url && (
                        <div className="mb-1">
                          <strong>Page:</strong> {new URL(event.page_url).pathname}
                        </div>
                      )}
                      {event.event_payload && (
                        <div>
                          <strong>Data:</strong>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded">
                            {JSON.stringify(event.event_payload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Internal Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.is_internal_user).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Events in Selected Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecureEventsDashboard;
