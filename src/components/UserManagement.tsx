import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, UserStatus } from '@/lib/types';
import { Users } from 'lucide-react';
import UserTable from './UserTable';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<UserStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // First, get all subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      // Then, fetch profiles data for all subscription user_ids
      const userIds = subscriptionsData.map(subscription => subscription.user_id).filter(Boolean);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        throw profilesError;
      }

      // Create a map of profiles by id for quick lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Transform data to match User interface
      const transformedUsers: User[] = subscriptionsData.map((subscription) => {
        let userStatus: UserStatus = 'active';
        if (subscription.status === 'inactive') {
          userStatus = 'expired';
        } else if (subscription.trial_end_date && new Date(subscription.trial_end_date) > new Date()) {
          userStatus = 'trial';
        } else if (subscription.status === 'canceled') {
          userStatus = 'cancelled';
        }

        // Get the profile from the map
        const profile = profilesMap.get(subscription.user_id);
        
        let displayName = 'Unknown User';
        let email = 'unknown@example.com';
        
        if (profile) {
          displayName = profile.display_name || 'Unknown User';
          email = profile.email || 'unknown@example.com';
        } else {
          displayName = subscription.stripe_customer_id || 'User ' + subscription.id;
          
          if (subscription.user_id && subscription.user_id.includes('@')) {
            email = subscription.user_id;
            if (displayName === 'User ' + subscription.id) {
              const emailParts = email.split('@');
              const rawName = emailParts[0].replace(/[^a-zA-Z0-9]/g, ' ');
              displayName = rawName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            }
          } else {
            email = `user-${subscription.id}@example.com`;
          }
        }

        // Update subscription amounts to $5 monthly or $50 yearly
        let subscriptionAmount = 0;
        if (subscription.type && subscription.type.includes('Monthly')) {
          subscriptionAmount = 5; // $5 monthly amount
        } else if (subscription.type && subscription.type.includes('Yearly')) {
          subscriptionAmount = 50; // $50 yearly amount
        }

        return {
          id: subscription.id.toString(),
          name: displayName,
          email: email,
          status: userStatus,
          trialEndsAt: subscription.trial_end_date ? new Date(subscription.trial_end_date) : null,
          subscriptionAmount: subscriptionAmount,
          subscriptionInterval: subscription.type?.includes('Monthly') ? 'monthly' : 'yearly',
          createdAt: new Date(subscription.created_at),
          lastActive: new Date(subscription.subscription_end_date || subscription.created_at),
        };
      });

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const numericId = parseInt(userId, 10);
      
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', numericId);

      if (error) {
        throw error;
      }

      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    let supabaseStatus = 'active';
    if (newStatus === 'expired' || newStatus === 'cancelled') {
      supabaseStatus = 'inactive';
    }

    try {
      let updateData: any = { status: supabaseStatus };
      
      if (newStatus === 'trial') {
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        
        updateData = {
          ...updateData,
          trial_start_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString()
        };
      }

      const numericId = parseInt(userId, 10);
      
      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', numericId);

      if (error) {
        throw error;
      }

      setUsers(users.map(user => 
        user.id === userId ? { 
          ...user, 
          status: newStatus,
          trialEndsAt: newStatus === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : user.trialEndsAt
        } : user
      ));
      
      toast.success(`User status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = selectedFilter === 'all' 
    ? users 
    : users.filter(user => user.status === selectedFilter);

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          <h2 className="text-2xl font-semibold tracking-tight">User Management</h2>
        </div>
        {/* Removed Add New User button */}
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('all')}
          className="text-sm"
        >
          All Users
        </Button>
        <Button
          variant={selectedFilter === 'active' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('active')}
          className="text-sm"
        >
          Active
        </Button>
        <Button
          variant={selectedFilter === 'trial' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('trial')}
          className="text-sm"
        >
          Trial
        </Button>
        <Button
          variant={selectedFilter === 'expired' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('expired')}
          className="text-sm"
        >
          Expired
        </Button>
        <Button
          variant={selectedFilter === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setSelectedFilter('cancelled')}
          className="text-sm"
        >
          Cancelled
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <UserTable 
          users={filteredUsers} 
          onDelete={handleDeleteUser}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default UserManagement;
