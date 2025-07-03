import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';
import { Card } from '@/components/ui/card';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';

interface AnalyticsData {
  totalSessions: number;
  totalEvents: number;
  contactSubmissions: number;
  topPages: Array<{ page: string; views: number }>;
  recentEvents: Array<{
    event_name: string;
    timestamp: string;
    page_url: string;
    event_payload: any;
  }>;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadAnalytics();
    }
  }, [authLoading, isAdmin]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data
      const [sessionsRes, eventsRes, contactsRes, recentEventsRes] = await Promise.all([
        supabase.from('sessions').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }),
        supabase
          .from('events')
          .select('event_name, timestamp, page_url, event_payload')
          .order('timestamp', { ascending: false })
          .limit(10)
      ]);

      // Get page views by URL
      const { data: pageViews } = await supabase
        .from('events')
        .select('page_url')
        .eq('event_name', 'page_view');

      // Process page views
      const pageViewCounts = pageViews?.reduce((acc: Record<string, number>, event) => {
        const url = new URL(event.page_url || '').pathname;
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      }, {}) || {};

      const topPages = Object.entries(pageViewCounts)
        .map(([page, views]) => ({ page, views: views as number }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      setAnalytics({
        totalSessions: sessionsRes.count || 0,
        totalEvents: eventsRes.count || 0,
        contactSubmissions: contactsRes.count || 0,
        topPages,
        recentEvents: recentEventsRes.data || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SkeletonLoader variant="card" className="w-96 h-48" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="heading-md mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have admin privileges to access this page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Admin Dashboard - Suphian Tweel"
        description="Analytics and site administration"
      />
      
      <div className="container-custom py-8">
        <h1 className="heading-lg mb-8">Analytics Dashboard</h1>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="h-32" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Total Sessions</h3>
                <p className="text-3xl font-bold text-accent">{analytics?.totalSessions}</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Total Events</h3>
                <p className="text-3xl font-bold text-accent">{analytics?.totalEvents}</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Contact Submissions</h3>
                <p className="text-3xl font-bold text-accent">{analytics?.contactSubmissions}</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
                <p className="text-3xl font-bold text-accent">
                  {analytics?.totalSessions && analytics?.contactSubmissions 
                    ? ((analytics.contactSubmissions / analytics.totalSessions) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </Card>
            </div>

            {/* Top Pages */}
            <Card className="p-6">
              <h3 className="heading-sm mb-4">Top Pages</h3>
              <div className="space-y-3">
                {analytics?.topPages.map((page, index) => (
                  <div key={page.page} className="flex justify-between items-center">
                    <span className="text-sm">{page.page === '/' ? 'Homepage' : page.page}</span>
                    <span className="text-sm font-medium text-accent">{page.views} views</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Events */}
            <Card className="p-6">
              <h3 className="heading-sm mb-4">Recent Events</h3>
              <div className="space-y-3">
                {analytics?.recentEvents.map((event, index) => (
                  <div key={index} className="border-b border-border/50 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{event.event_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new URL(event.page_url || '').pathname}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;