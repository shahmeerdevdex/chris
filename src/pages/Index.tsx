
import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import StatCard from '@/components/StatCard';
import UserManagement from '@/components/UserManagement';
import RevenueChart from '@/components/RevenueChart';
import ActiveUsersChart from '@/components/ActiveUsersChart';
import UpcomingTrialEnds from '@/components/UpcomingTrialEnds';
import { 
  CreditCard, 
  Users, 
  Activity, 
  Clock,
  TrendingUp
} from 'lucide-react';
import { RevenueMetrics } from '@/lib/types';
import { 
  formatCurrency, 
  formatPercentage
} from '@/lib/data';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const Index = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [trialUsers, setTrialUsers] = useState(0);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    mrr: 0,
    arr: 0,
    totalRevenue: 0,
    activeUsers: 0,
    trialUsers: 0,
    conversionRate: 0,
    churnRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchUserStats();
  }, []);
  
  const fetchUserStats = async () => {
    setIsLoading(true);
    try {
      // Get all subscriptions to calculate metrics properly
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');
      
      if (subscriptionsError) throw subscriptionsError;
      
      // Count active and trial users
      const today = new Date();
      let activeCount = 0;
      let trialCount = 0;
      
      // Monthly revenue calculation
      const monthlySubscriptionPrice = 5; // $5 per subscription
      const monthlyRevenue = new Map();
      
      // Process each subscription
      subscriptionsData.forEach(subscription => {
        // Check if the user is in trial
        if (subscription.trial_end_date && new Date(subscription.trial_end_date) > today) {
          trialCount++;
        } 
        // Check if the user is active (and not in trial)
        else if (subscription.status === 'active') {
          activeCount++;
          
          // Calculate revenue by month
          if (subscription.subscription_start_date) {
            const startDate = new Date(subscription.subscription_start_date);
            const endDate = subscription.subscription_end_date 
              ? new Date(subscription.subscription_end_date) 
              : today;
            
            let currentDate = new Date(startDate);
            
            // Loop through each month from start date to end date or today
            while (currentDate <= endDate) {
              const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
              const monthName = currentDate.toLocaleString('default', { month: 'short' });
              const yearMonth = `${monthName} ${currentDate.getFullYear()}`;
              
              // Skip trial periods for revenue calculation
              const trialEndDate = subscription.trial_end_date 
                ? new Date(subscription.trial_end_date) 
                : null;
              
              if (!trialEndDate || currentDate > trialEndDate) {
                if (!monthlyRevenue.has(monthKey)) {
                  monthlyRevenue.set(monthKey, {
                    month: monthName,
                    year: currentDate.getFullYear(),
                    revenue: monthlySubscriptionPrice,
                    newSubscribers: 0,
                    churnedSubscribers: 0,
                    monthOrder: currentDate.getMonth() + 1,
                    formattedMonth: yearMonth,
                  });
                } else {
                  const monthData = monthlyRevenue.get(monthKey);
                  monthData.revenue += monthlySubscriptionPrice;
                }
              }
              
              // Move to the next month
              currentDate.setMonth(currentDate.getMonth() + 1);
            }
            
            // Count new subscribers for the month they started
            const startMonthKey = `${startDate.getFullYear()}-${startDate.getMonth() + 1}`;
            if (monthlyRevenue.has(startMonthKey)) {
              const monthData = monthlyRevenue.get(startMonthKey);
              monthData.newSubscribers += 1;
            }
            
            // Count churned subscribers for the month they ended (if they ended)
            if (subscription.subscription_end_date && subscription.status !== 'active') {
              const endMonthKey = `${endDate.getFullYear()}-${endDate.getMonth() + 1}`;
              if (monthlyRevenue.has(endMonthKey)) {
                const monthData = monthlyRevenue.get(endMonthKey);
                monthData.churnedSubscribers += 1;
              }
            }
          }
        }
      });
      
      // Find December's revenue or current month if December data not available
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // Create key for December of current year
      const decemberKey = `${currentYear}-12`;
      // Create key for current month as fallback
      const currentMonthKey = `${currentYear}-${currentMonth}`;
      
      // Get December revenue or current month as fallback
      let currentMRR = 0;
      if (monthlyRevenue.has(decemberKey)) {
        currentMRR = monthlyRevenue.get(decemberKey).revenue;
      } else if (monthlyRevenue.has(currentMonthKey)) {
        currentMRR = monthlyRevenue.get(currentMonthKey).revenue;
      } else {
        // Use active users count as a fallback if no monthly data
        currentMRR = activeCount * monthlySubscriptionPrice;
      }
      
      // Calculate total annual revenue
      let totalRevenue = 0;
      monthlyRevenue.forEach(month => {
        totalRevenue += month.revenue;
      });
      
      // Set values to state
      setActiveUsers(activeCount);
      setTrialUsers(trialCount);
      
      // Calculate conversion and churn rates (using real data or placeholder)
      const totalUsersEver = subscriptionsData.length;
      const conversionRate = totalUsersEver > 0 ? activeCount / totalUsersEver : 0;
      
      // Calculate churn rate based on ended subscriptions divided by total
      const endedSubscriptions = subscriptionsData.filter(s => 
        s.subscription_end_date && s.status !== 'active').length;
      const churnRate = totalUsersEver > 0 ? endedSubscriptions / totalUsersEver : 0;
      
      setRevenueMetrics({
        mrr: currentMRR,
        arr: currentMRR * 12,
        totalRevenue: totalRevenue,
        activeUsers: activeCount,
        trialUsers: trialCount,
        conversionRate: conversionRate,
        churnRate: churnRate,
      });
      
      // Convert monthly revenue map to array for the chart component
      const monthlyRevenueArray = Array.from(monthlyRevenue.values())
        .sort((a, b) => (a.year === b.year) 
          ? a.monthOrder - b.monthOrder 
          : a.year - b.year);
      
      // Store formatted monthly revenue data in localStorage for the chart component
      localStorage.setItem('monthlyRevenueData', JSON.stringify(monthlyRevenueArray));
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      
      <main className="flex-1 overflow-auto">
        <div className="container py-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl animate-slide-down">
              Dashboard
            </h1>
            <p className="text-muted-foreground animate-slide-down" style={{ animationDelay: '50ms' }}>
              Monitor user activity, revenue, and trial conversions.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Monthly Recurring Revenue"
              value={formatCurrency(revenueMetrics.mrr)}
              description="Revenue billed monthly ($5/subscription)"
              change={{ value: 8.2, isPositive: true }}
              icon={<CreditCard className="h-5 w-5 text-primary" />}
              className="animate-scale-in"
              style={{ animationDelay: '100ms' }}
            />
            <StatCard
              title="Active Users"
              value={activeUsers.toString()}
              description="Currently paying customers"
              change={{ value: 5.1, isPositive: true }}
              icon={<Users className="h-5 w-5 text-primary" />}
              className="animate-scale-in"
              style={{ animationDelay: '150ms' }}
            />
            <StatCard
              title="Trial Users"
              value={trialUsers.toString()}
              description="Users in trial period"
              change={{ value: 12.5, isPositive: true }}
              icon={<Clock className="h-5 w-5 text-primary" />}
              className="animate-scale-in"
              style={{ animationDelay: '200ms' }}
            />
            <StatCard
              title="Conversion Rate"
              value={formatPercentage(revenueMetrics.conversionRate)}
              description="Trial to paid conversion"
              change={{ value: 3.2, isPositive: true }}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              className="animate-scale-in"
              style={{ animationDelay: '250ms' }}
            />
          </div>
          
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <ActiveUsersChart />
          </div>
          
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <UserManagement />
            </div>
            <UpcomingTrialEnds />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
