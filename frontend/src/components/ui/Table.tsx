import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-charcoal-900/80 border-b border-charcoal-800">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-charcoal-800">
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr 
      className={cn(
        'hover:bg-charcoal-800/50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('text-left text-charcoal-400 font-medium py-3 px-4 text-xs uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('text-charcoal-300 py-3 px-4', className)}>
      {children}
    </td>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const colors: Record<string, string> = {
    PRESENT: 'bg-green-500/15 text-green-400',
    LATE: 'bg-orange-500/15 text-orange-400',
    ABSENT: 'bg-red-500/15 text-red-400',
    ACTIVE: 'bg-green-500/15 text-green-400',
    INACTIVE: 'bg-gray-500/15 text-gray-400',
    SUSPENDED: 'bg-red-500/15 text-red-400',
    PENDING: 'bg-yellow-500/15 text-yellow-400',
    APPROVED: 'bg-green-500/15 text-green-400',
    REJECTED: 'bg-red-500/15 text-red-400',
    SCHEDULED: 'bg-blue-500/15 text-blue-400',
    IN_PROGRESS: 'bg-green-500/15 text-green-400',
    CLOSED: 'bg-gray-500/15 text-gray-400',
    CANCELLED: 'bg-red-500/15 text-red-400',
    LOW: 'bg-green-500/15 text-green-400',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400',
    HIGH: 'bg-orange-500/15 text-orange-400',
    CRITICAL: 'bg-red-500/15 text-red-400',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      colors[status] || 'bg-gray-500/15 text-gray-400',
      className
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}