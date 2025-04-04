
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties; // Add the style prop to the interface
}

const StatCard = ({
  title,
  value,
  description,
  change,
  icon,
  className,
  style,
}: StatCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'rounded-xl p-6 border bg-card shadow-sm hover-lift transition-opacity duration-500 ease-in-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={style} // Apply the style prop
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {change && (
            <p className={`text-sm font-medium ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {icon && <div className="rounded-full bg-primary/10 p-2.5">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
