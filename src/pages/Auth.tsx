import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import supabase from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { WaveButton } from '@/components/ui/wave-button';
import SEOHead from '@/components/SEOHead';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to home
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your signup.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been successfully signed in.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEOHead 
        title={`${isSignUp ? 'Sign Up' : 'Sign In'} - Suphian Tweel`}
        description="Access admin dashboard and analytics"
      />
      
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="heading-md">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp 
              ? 'Sign up to access the admin dashboard' 
              : 'Sign in to access analytics and admin features'
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <WaveButton
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </WaveButton>
        </form>

        <div className="text-center space-y-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-accent hover:underline"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
          
          <Link 
            to="/" 
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Auth;