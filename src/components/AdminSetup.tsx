import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { promoteUserToAdmin, checkAdminExists } from '@/utils/adminSetup';
import { useToast } from '@/hooks/use-toast';

/**
 * AdminSetup Component
 * 
 * This component allows promoting the first user to admin.
 * It should only be used during initial setup and can be removed after the first admin is created.
 * 
 * Usage: Add this component temporarily to any page where you want to set up the first admin.
 * After setup is complete, this component can be removed from the codebase.
 */
const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkForExistingAdmin = async () => {
      const exists = await checkAdminExists();
      setAdminExists(exists);
      setCheckingAdmin(false);
    };

    checkForExistingAdmin();
  }, []);

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await promoteUserToAdmin(email.trim());
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        setEmail('');
        // Recheck admin status
        const exists = await checkAdminExists();
        setAdminExists(exists);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Checking admin status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (adminExists) {
    return (
      <Alert>
        <AlertDescription>
          ✅ Admin user already exists. This setup component can be removed from the codebase.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin Setup</CardTitle>
        <CardDescription>
          Promote the first user to admin role. This is a one-time setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            ⚠️ This component should be removed after the first admin is created.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handlePromoteUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">User Email to Promote</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the email of a registered user to promote them to admin.
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Promoting User...' : 'Promote to Admin'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminSetup;