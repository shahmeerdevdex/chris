
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from 'recharts';
import { MonthlyRevenue } from '@/lib/types';
import { formatCurrency } from '@/lib/data';

interface RevenueChartProps {
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const revenue = payload[0]?.value as number;
    const subscriptions = Math.round(revenue / 5); // Each subscription is $5

    return (
      <div className="rounded-md border bg-background p-3 shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary font-semibold">
          Revenue: {formatCurrency(revenue)} ({subscriptions} subscriptions)
        </p>
        <p className="text-green-500">
          New Subscribers: {payload[1]?.value}
        </p>
        <p className="text-red-500">
          Churned: {payload[2]?.value}
        </p>
      </div>
    );
  }

  return null;
};

const RevenueChart = ({ className }: RevenueChartProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get data from localStorage that was saved in Index.tsx
    const storedData = localStorage.getItem('monthlyRevenueData');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
      } catch (error) {
        console.error('Error parsing revenue data from localStorage:', error);
      }
    }
    
    setIsLoading(false);
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || isLoading) {
    return <div className={`h-[300px] ${className} animate-pulse bg-muted rounded-xl`} />;
  }

  // Format x-axis labels to show month and year
  const formattedData = data.map(item => ({
    ...item,
    month: item.formattedMonth || item.month, // Use formatted month if available, fall back to month
  }));

  return (
    <div className={`space-y-4 rounded-xl border bg-card p-6 animate-scale-in ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Monthly Revenue ($5/subscription)</h3>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={20}
              name="Revenue"
            />
            <Bar
              yAxisId="right"
              dataKey="newSubscribers"
              fill="#4ade80"
              radius={[4, 4, 0, 0]}
              barSize={20}
              name="New Subscribers"
            />
            <Bar
              yAxisId="right"
              dataKey="churnedSubscribers"
              fill="#f87171"
              radius={[4, 4, 0, 0]}
              barSize={20}
              name="Churned"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
