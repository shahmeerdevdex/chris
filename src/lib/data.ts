
import { User, MonthlyRevenue, DailyActiveUsers, RevenueMetrics, UserStatus } from './types';

// Helper to create dates relative to today
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Generate mock users
export const USERS: User[] = [
  {
    id: '1',
    name: 'Emma Thompson',
    email: 'emma@example.com',
    status: 'active',
    trialEndsAt: null,
    subscriptionAmount: 49,
    subscriptionInterval: 'monthly',
    createdAt: daysAgo(120),
    lastActive: daysAgo(0),
  },
  {
    id: '2',
    name: 'James Wilson',
    email: 'james@example.com',
    status: 'trial',
    trialEndsAt: daysFromNow(7),
    subscriptionAmount: 0,
    subscriptionInterval: null,
    createdAt: daysAgo(10),
    lastActive: daysAgo(1),
  },
  {
    id: '3',
    name: 'Sophia Chen',
    email: 'sophia@example.com',
    status: 'active',
    trialEndsAt: null,
    subscriptionAmount: 499,
    subscriptionInterval: 'yearly',
    createdAt: daysAgo(90),
    lastActive: daysAgo(2),
  },
  {
    id: '4',
    name: 'Michael Rodriguez',
    email: 'michael@example.com',
    status: 'trial',
    trialEndsAt: daysFromNow(2),
    subscriptionAmount: 0,
    subscriptionInterval: null,
    createdAt: daysAgo(12),
    lastActive: daysAgo(0),
  },
  {
    id: '5',
    name: 'Olivia Johnson',
    email: 'olivia@example.com',
    status: 'expired',
    trialEndsAt: daysAgo(5),
    subscriptionAmount: 0,
    subscriptionInterval: null,
    createdAt: daysAgo(35),
    lastActive: daysAgo(6),
  },
  {
    id: '6',
    name: 'William Brown',
    email: 'william@example.com',
    status: 'active',
    trialEndsAt: null,
    subscriptionAmount: 49,
    subscriptionInterval: 'monthly',
    createdAt: daysAgo(60),
    lastActive: daysAgo(0),
  },
  {
    id: '7',
    name: 'Alexander Davis',
    email: 'alex@example.com',
    status: 'cancelled',
    trialEndsAt: null,
    subscriptionAmount: 0,
    subscriptionInterval: null,
    createdAt: daysAgo(150),
    lastActive: daysAgo(30),
  },
  {
    id: '8',
    name: 'Isabella Martinez',
    email: 'isabella@example.com',
    status: 'active',
    trialEndsAt: null,
    subscriptionAmount: 49,
    subscriptionInterval: 'monthly',
    createdAt: daysAgo(45),
    lastActive: daysAgo(1),
  },
  {
    id: '9',
    name: 'Ethan Taylor',
    email: 'ethan@example.com',
    status: 'trial',
    trialEndsAt: daysFromNow(10),
    subscriptionAmount: 0,
    subscriptionInterval: null,
    createdAt: daysAgo(5),
    lastActive: daysAgo(0),
  },
  {
    id: '10',
    name: 'Charlotte Anderson',
    email: 'charlotte@example.com',
    status: 'active',
    trialEndsAt: null,
    subscriptionAmount: 499,
    subscriptionInterval: 'yearly',
    createdAt: daysAgo(75),
    lastActive: daysAgo(3),
  },
  {
    id: '11',
    name: 'Daniel Williams',
    email: 'daniel@example.com',
    status: 'trial',
    trialEndsAt: daysFromNow(14),
    subscriptionAmount: 0,
    subscriptionInterval: null,
    createdAt: daysAgo(1),
    lastActive: daysAgo(0),
  },
  {
    id: '12',
    name: 'Ava Wilson',
    email: 'ava@example.com',
    status: 'expired',
    trialEndsAt: daysAgo(2),
    subscriptionAmount: 0,
    subscriptionInterval: null,
    createdAt: daysAgo(16),
    lastActive: daysAgo(3),
  }
];

// Generate monthly revenue data for the past year
export const MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 12500, newSubscribers: 45, churnedSubscribers: 10 },
  { month: 'Feb', revenue: 15000, newSubscribers: 52, churnedSubscribers: 8 },
  { month: 'Mar', revenue: 18000, newSubscribers: 63, churnedSubscribers: 12 },
  { month: 'Apr', revenue: 24000, newSubscribers: 78, churnedSubscribers: 15 },
  { month: 'May', revenue: 28500, newSubscribers: 85, churnedSubscribers: 20 },
  { month: 'Jun', revenue: 32000, newSubscribers: 92, churnedSubscribers: 18 },
  { month: 'Jul', revenue: 38000, newSubscribers: 105, churnedSubscribers: 22 },
  { month: 'Aug', revenue: 42500, newSubscribers: 115, churnedSubscribers: 25 },
  { month: 'Sep', revenue: 45000, newSubscribers: 120, churnedSubscribers: 30 },
  { month: 'Oct', revenue: 48000, newSubscribers: 128, churnedSubscribers: 22 },
  { month: 'Nov', revenue: 52000, newSubscribers: 138, churnedSubscribers: 28 },
  { month: 'Dec', revenue: 56000, newSubscribers: 145, churnedSubscribers: 32 },
];

// Generate daily active users data for the past 30 days
export const DAILY_ACTIVE_USERS: DailyActiveUsers[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const formattedDate = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
  
  // Generate some random but realistic data
  const baseActiveUsers = 350;
  const baseTrialUsers = 120;
  const dayVariation = Math.sin(i / 5) * 50; // Create some wave pattern
  const weekendDip = [0, 6].includes(date.getDay()) ? -30 : 0; // Less activity on weekends
  
  return {
    date: formattedDate,
    active: Math.max(0, Math.round(baseActiveUsers + dayVariation + weekendDip + i * 3)),
    trial: Math.max(0, Math.round(baseTrialUsers + (dayVariation / 2) + (i / 2))),
  };
});

// Calculate revenue metrics
export const REVENUE_METRICS: RevenueMetrics = {
  mrr: 38200,
  arr: 458400,
  totalRevenue: 320500,
  activeUsers: USERS.filter(user => user.status === 'active').length,
  trialUsers: USERS.filter(user => user.status === 'trial').length,
  conversionRate: 0.68,
  churnRate: 0.043,
};

// Helper function to get users with trials ending soon
export const getUpcomingTrialEnds = (days: number = 14) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  
  return USERS.filter(user => 
    user.status === 'trial' && 
    user.trialEndsAt !== null && 
    user.trialEndsAt <= cutoffDate
  ).sort((a, b) => {
    return (a.trialEndsAt?.getTime() || 0) - (b.trialEndsAt?.getTime() || 0);
  });
};

// Function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Function to format percentage
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Function to format date
export const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Function to get a color for a user status
export const getUserStatusColor = (status: UserStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'trial':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'expired':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

// Create a new user with a unique ID
export const createUser = (userData: Omit<User, 'id'>): User => {
  return {
    ...userData,
    id: Math.random().toString(36).substring(2, 10),
  };
};
