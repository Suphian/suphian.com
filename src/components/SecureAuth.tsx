
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/integrations/supabase/client';
import { validatePassword, checkAuthRateLimit, sanitizeInput } from '@/utils/security';
import { Eye, EyeOff, Shield } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().refine((password) => {
    const validation = validatePassword(password);
    return validation.isValid;
  }, {
    message: 'Password does not meet security requirements'
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

export const SecureAuth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: false, errors: [] });
  const { toast } = useToast();

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  const currentForm = isSignUp ? signUpForm : signInForm;

  const handlePasswordChange = (password: string) => {
    if (isSignUp) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
    }
  };

  const getClientIdentifier = () => {
    return 'auth_' + (navigator.userAgent + window.location.hostname).slice(0, 50);
  };

  const onSignIn = async (data: SignInData) => {
    try {
      const identifier = getClientIdentifier();
      const isAllowed = await checkAuthRateLimit(identifier, 'login');
      
      if (!isAllowed) {
        toast({
          title: 'Too many login attempts',
          description: 'Please wait before trying again.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizeInput(data.email, 255),
        password: data.password
      });

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have been signed in successfully.'
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'An error occurred',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const onSignUp = async (data: SignUpData) => {
    try {
      const identifier = getClientIdentifier();
      const isAllowed = await checkAuthRateLimit(identifier, 'signup');
      
      if (!isAllowed) {
        toast({
          title: 'Too many signup attempts',
          description: 'Please wait before trying again.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: sanitizeInput(data.email, 255),
        password: data.password
      });

      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link.'
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: 'An error occurred',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            {isSignUp ? 'Create account' : 'Sign in'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Enter your details to create a secure account' 
              : 'Enter your credentials to access your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...currentForm}>
            <form 
              onSubmit={currentForm.handleSubmit(isSignUp ? onSignUp : onSignIn)} 
              className="space-y-4"
            >
              <FormField
                control={currentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email"
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={currentForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete={isSignUp ? 'new-password' : 'current-password'}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (isSignUp) handlePasswordChange(e.target.value);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSignUp && (
                <>
                  {passwordValidation.errors.length > 0 && (
                    <Alert>
                      <AlertDescription>
                        <ul className="text-sm space-y-1">
                          {passwordValidation.errors.map((error, index) => (
                            <li key={index} className="text-destructive">• {error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
                              autoComplete="new-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={currentForm.formState.isSubmitting}
              >
                {currentForm.formState.isSubmitting 
                  ? (isSignUp ? 'Creating account...' : 'Signing in...') 
                  : (isSignUp ? 'Create account' : 'Sign in')
                }
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                currentForm.reset();
                setPasswordValidation({ isValid: false, errors: [] });
              }}
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureAuth;
