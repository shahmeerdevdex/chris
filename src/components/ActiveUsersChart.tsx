
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { DailyActiveUsers } from '@/lib/types';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface ActiveUsersChartProps {
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-background p-3 shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-blue-500 font-semibold">
          Active Users: {payload[0]?.value}
        </p>
        <p className="text-indigo-500">
          Trial Users: {payload[1]?.value}
        </p>
      </div>
    );
  }

  return null;
};

const ActiveUsersChart = ({ className }: ActiveUsersChartProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState<DailyActiveUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveUsersData = async () => {
      try {
        const { data: activeUsersData, error } = await supabase
          .from('daily_active_users')
          .select('*')
          .order('date', { ascending: true })
          .limit(30);
        
        if (error) {
          throw error;
        }
        
        // Transform data to match our DailyActiveUsers type
        const transformedData: DailyActiveUsers[] = activeUsersData.map(item => {
          // Format the date to "DD MMM" format
          const dateObj = new Date(item.date);
          const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;
          
          return {
            date: formattedDate,
            active: item.active_users,
            trial: item.trial_users
          };
        });
        
        setData(transformedData);
      } catch (error) {
        console.error('Error fetching active users data:', error);
        toast.error('Failed to load active users data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveUsersData();
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || isLoading) {
    return <div className={`h-[300px] ${className} animate-pulse bg-muted rounded-xl`} />;
  }

  return (
    <div className={`space-y-4 rounded-xl border bg-card p-6 animate-scale-in ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Daily Active Users</h3>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
              minTickGap={15}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="active" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Active Users"
            />
            <Line 
              type="monotone" 
              dataKey="trial" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Trial Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActiveUsersChart;
