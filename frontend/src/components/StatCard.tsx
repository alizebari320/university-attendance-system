import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: string; trend: 'up' | 'down' | 'neutral' };
  icon: ReactNode;
  gradient?: string;
}

export function StatCard({ title, value, change, icon, gradient }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-charcoal-800 bg-charcoal-900/50 p-5',
      'hover:border-charcoal-700 transition-colors'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-charcoal-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={cn(
              'text-xs mt-2',
              change.trend === 'up' && 'text-green-400',
              change.trend === 'down' && 'text-red-400',
              change.trend === 'neutral' && 'text-charcoal-400'
            )}>
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'}
              {' '}{change.value}
            </p>
          )}
        </div>
        <div className={cn(
          'w-11 h-11 rounded-lg flex items-center justify-center',
          gradient || 'bg-blue-500/15 text-blue-400'
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}