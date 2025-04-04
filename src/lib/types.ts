
export type UserStatus = 'active' | 'trial' | 'expired' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  trialEndsAt: Date | null;
  subscriptionAmount: number;
  subscriptionInterval: 'monthly' | 'yearly' | null;
  createdAt: Date;
  lastActive: Date;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  newSubscribers: number;
  churnedSubscribers: number;
  formattedMonth?: string; // Add this optional property
}

export interface DailyActiveUsers {
  date: string;
  active: number;
  trial: number;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeUsers: number;
  trialUsers: number;
  conversionRate: number;
  churnRate: number;
}
