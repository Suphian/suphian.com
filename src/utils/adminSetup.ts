import supabase from '@/integrations/supabase/client';

/**
 * Utility function to promote a user to admin role
 * This should be used carefully and only by authorized personnel
 */
export const promoteUserToAdmin = async (userEmail: string): Promise<{ success: boolean; message: string }> => {
  try {
    // First check if the current user is already an admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: 'You must be logged in to perform this action' };
    }

    // Check if the current user is admin (except for the first admin setup)
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If there are no admins yet, allow the first user to promote someone
    const { data: adminCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('role', 'admin');

    if (adminCount && adminCount.length > 0 && currentUserProfile?.role !== 'admin') {
      return { success: false, message: 'Only existing admins can promote other users' };
    }

    // Use the database function to promote the user
    const { error } = await supabase.rpc('promote_user_to_admin', {
      user_email: userEmail
    });

    if (error) {
      console.error('Error promoting user:', error);
      return { success: false, message: `Failed to promote user: ${error.message}` };
    }

    return { success: true, message: `Successfully promoted ${userEmail} to admin` };
  } catch (error) {
    console.error('Unexpected error promoting user:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

/**
 * Check if any admin users exist in the system
 */
export const checkAdminExists = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('role', 'admin');

    if (error) {
      console.error('Error checking admin existence:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Unexpected error checking admin existence:', error);
    return false;
  }
};