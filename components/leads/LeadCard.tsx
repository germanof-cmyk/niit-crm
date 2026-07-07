'use client';

import { Lead } from '@/lib/types';
import { AlertTriangle, Calendar } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STATUS_SOLID } from '@/components/ui/StatusBadge';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
}

function Avatar({ name, status }: { name: string; status: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
  const bg = STATUS_SOLID[status] || '#1C4061';
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
      style={{ background: bg }}
    >
      <span className="text-white font-bold" style={{ fontSize: 9 }}>{initials}</span>
    </div>
  );
}

export default function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const hasNextAction = !!lead.next_action_date;
  const isOverdue = hasNextAction &&
    isPast(new Date(lead.next_action_date!)) &&
    !isToday(new Date(lead.next_action_date!));

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border cursor-pointer transition-all duration-150 select-none',
        'hover:-translate-y-0.5',
        isOverdue
          ? 'border-red-200 shadow-[0_2px_8px_rgba(220,38,38,0.12)]'
          : 'border-niit-line shadow-card hover:shadow-card-hover',
        isDragging && 'shadow-2xl rotate-1 opacity-90 scale-[1.02]'
      )}
    >
      {/* Overdue badge */}
      {isOverdue && (
        <div className="flex justify-end px-3 pt-2.5">
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: '#FEF2F2', color: '#DC2626' }}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            Vencida
          </div>
        </div>
      )}

      <div className={cn('px-3', isOverdue ? 'pt-1' : 'pt-3')}>
        {/* Company */}
        <p className="font-extrabold text-[13px] leading-tight" style={{ color: '#1C4061' }}>
          {lead.company}
        </p>
        {/* Contact */}
        <p className="text-[12px] mt-0.5" style={{ color: '#64748B' }}>
          {lead.contact_name}
          {lead.role && <span className="opacity-70"> · {lead.role}</span>}
        </p>

        {/* Chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {/* Country */}
          <span
            className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ background: '#F4F6F9', color: '#1C4061' }}
          >
            {lead.country}
          </span>
          {/* Interest */}
          <span
            className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ background: '#FEF0E8', color: '#C24E12' }}
          >
            {lead.interest.length > 20 ? lead.interest.slice(0, 20) + '…' : lead.interest}
          </span>
        </div>

        {/* Origin chip */}
        <div className="mt-1">
          <span
            className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ background: '#F4F6F9', color: '#64748B' }}
          >
            {lead.origin}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-2 mt-2 border-t"
        style={{ borderColor: '#E3E8EF' }}
      >
        <div className={cn('flex items-center gap-1 text-[11px] font-semibold', isOverdue ? 'text-red-600' : 'text-niit-muted')}>
          <Calendar className="w-3 h-3" />
          {hasNextAction
            ? format(new Date(lead.next_action_date!), "dd MMM", { locale: ptBR })
            : <span className="font-normal opacity-50">sem data</span>
          }
        </div>
        {lead.responsible ? (
          <Avatar name={lead.responsible} status={lead.status} />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-niit-line" />
        )}
      </div>
    </div>
  );
}
