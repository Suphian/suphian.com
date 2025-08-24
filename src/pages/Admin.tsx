import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityMonitor } from '@/utils/security/securityMonitor';
import supabase from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactSubmission {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

interface AnalyticsSession {
  id: string;
  created_at: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  visit_count: number;
}

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadContactSubmissions();
      loadAnalyticsSessions();
      
      // Log admin access
      SecurityMonitor.logAdminAccess('dashboard_view', 'admin_panel');
    }
  }, [user, isAdmin]);

  const loadContactSubmissions = async () => {
    setLoadingContacts(true);
    try {
      const { data, error } = await supabase.rpc('get_contact_submissions');
      
      if (error) {
        throw error;
      }
      
      setContacts(data || []);
      await SecurityMonitor.logAdminAccess('view_contacts', 'contact_submissions');
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contact submissions');
      toast({
        title: 'Error',
        description: 'Failed to load contact submissions',
        variant: 'destructive',
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadAnalyticsSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase.rpc('get_analytics_sessions', {
        limit_count: 50
      });
      
      if (error) {
        throw error;
      }
      
      setSessions(data || []);
      await SecurityMonitor.logAdminAccess('view_analytics', 'analytics_sessions');
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load analytics data');
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage contact submissions and view analytics</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Contact Submissions
                <Badge variant="secondary">{contacts.length}</Badge>
              </CardTitle>
              <CardDescription>
                Recent contact form submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingContacts ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading contacts...</p>
                </div>
              ) : contacts.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{contact.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(contact.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                      {contact.subject && (
                        <p className="text-sm font-medium">{contact.subject}</p>
                      )}
                      <p className="text-sm">{contact.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No contact submissions yet
                </p>
              )}
              <Button
                onClick={loadContactSubmissions}
                variant="outline"
                className="w-full mt-4"
                disabled={loadingContacts}
              >
                Refresh
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Sessions
                <Badge variant="secondary">{sessions.length}</Badge>
              </CardTitle>
              <CardDescription>
                Latest visitor sessions and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading sessions...</p>
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {session.country && session.city 
                              ? `${session.city}, ${session.country}`
                              : session.country || 'Unknown Location'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.browser} • {session.os} • {session.device_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Visit #{session.visit_count}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No session data available
                </p>
              )}
              <Button
                onClick={loadAnalyticsSessions}
                variant="outline"
                className="w-full mt-4"
                disabled={loadingSessions}
              >
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;