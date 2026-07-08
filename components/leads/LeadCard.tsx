'use client';

import { Lead } from '@/lib/types';
import { AlertTriangle, Calendar } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STATUS_SOLID } from '@/components/ui/StatusBadge';

export type CardDensity = 'compact' | 'comfortable';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  isDragging?: boolean;
  density?: CardDensity;
}

/* ── Country siglas ─────────────────────────────── */
const COUNTRY_CODE: Record<string, string> = {
  'Brasil': 'BR', 'México': 'MX', 'Argentina': 'AR',
  'Colômbia': 'CO', 'Paraguai': 'PY', 'Chile': 'CL',
  'Peru': 'PE', 'Estados Unidos': 'US', 'Outro': '?',
};

/* ── Shared sub-components ───────────────────────── */
function AvatarSmall({ name, status }: { name: string; status: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{ background: STATUS_SOLID[status] || '#1C4061' }}
    >
      <span className="text-white font-bold" style={{ fontSize: 8 }}>{initials}</span>
    </div>
  );
}

function AvatarNormal({ name, status }: { name: string; status: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
      style={{ background: STATUS_SOLID[status] || '#1C4061' }}
    >
      <span className="text-white font-bold" style={{ fontSize: 9 }}>{initials}</span>
    </div>
  );
}

/* ── Compact card ────────────────────────────────── */
function CompactCard({ lead, onClick, isDragging }: Omit<LeadCardProps, 'density'>) {
  const hasDate = !!lead.next_action_date;
  const isOverdue = hasDate &&
    isPast(new Date(lead.next_action_date!)) &&
    !isToday(new Date(lead.next_action_date!));
  const code = COUNTRY_CODE[lead.country] ?? lead.country.slice(0, 2).toUpperCase();

  const tooltip = [
    lead.origin && `Origem: ${lead.origin}`,
    lead.country !== 'Brasil' ? lead.country : null,
    !lead.responsible ? 'Sem responsável' : null,
    lead.next_action ? `Próx. ação: ${lead.next_action}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      onClick={onClick}
      title={tooltip || undefined}
      className={cn(
        'bg-white rounded-lg border cursor-pointer select-none',
        'transition-all duration-150 hover:-translate-y-px',
        isOverdue
          ? 'border-l-[3px] border-l-red-500 border-t-red-100 border-r-red-100 border-b-red-100'
          : 'border-niit-line',
        isDragging && 'shadow-2xl rotate-1 opacity-90 scale-[1.02]'
      )}
      style={{
        boxShadow: isDragging
          ? undefined
          : isOverdue
          ? '0 1px 3px rgba(220,38,38,0.10)'
          : '0 1px 2px rgba(28,64,97,0.06)',
      }}
    >
      <div className="p-2 space-y-1">
        {/* Line 1: company + overdue mark + country code */}
        <div className="flex items-center gap-1 min-w-0">
          <p
            className="font-bold text-[13px] leading-tight truncate flex-1 min-w-0"
            style={{ color: '#1C4061' }}
          >
            {lead.company}
          </p>
          {isOverdue && (
            <span className="text-[11px] font-extrabold shrink-0" style={{ color: '#DC2626' }}>!</span>
          )}
          <span
            className="px-1 rounded text-[9px] font-bold tracking-wide shrink-0"
            style={{ background: '#F4F6F9', color: '#64748B' }}
          >
            {code}
          </span>
        </div>

        {/* Line 2: contact name + role */}
        <p className="text-[11px] truncate leading-tight" style={{ color: '#64748B' }}>
          {lead.contact_name}
          {lead.role && <span className="opacity-70"> · {lead.role}</span>}
        </p>

        {/* Line 3: interest chip */}
        <div>
          <span
            className="inline-block max-w-full truncate px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ background: '#FEF0E8', color: '#C24E12' }}
          >
            {lead.interest.length > 26 ? lead.interest.slice(0, 26) + '…' : lead.interest}
          </span>
        </div>

        {/* Line 4: footer — only if there's something to show */}
        {(hasDate || lead.responsible) && (
          <div className="flex items-center justify-between pt-0.5 min-h-[18px]">
            <span>
              {hasDate && (
                <span
                  className="flex items-center gap-0.5 text-[10px] font-medium"
                  style={{ color: isOverdue ? '#DC2626' : '#94A3B8' }}
                >
                  <Calendar className="w-2.5 h-2.5 shrink-0" />
                  {format(new Date(lead.next_action_date!), 'dd MMM', { locale: ptBR })}
                </span>
              )}
            </span>
            {lead.responsible && (
              <AvatarSmall name={lead.responsible} status={lead.status} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Comfortable card (original) ─────────────────── */
function ComfortableCard({ lead, onClick, isDragging }: Omit<LeadCardProps, 'density'>) {
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
        <p className="font-extrabold text-[13px] leading-tight" style={{ color: '#1C4061' }}>
          {lead.company}
        </p>
        <p className="text-[12px] mt-0.5" style={{ color: '#64748B' }}>
          {lead.contact_name}
          {lead.role && <span className="opacity-70"> · {lead.role}</span>}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#F4F6F9', color: '#1C4061' }}>
            {lead.country}
          </span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#FEF0E8', color: '#C24E12' }}>
            {lead.interest.length > 20 ? lead.interest.slice(0, 20) + '…' : lead.interest}
          </span>
        </div>
        <div className="mt-1">
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#F4F6F9', color: '#64748B' }}>
            {lead.origin}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 mt-2 border-t" style={{ borderColor: '#E3E8EF' }}>
        <div className={cn('flex items-center gap-1 text-[11px] font-semibold', isOverdue ? 'text-red-600' : 'text-niit-muted')}>
          <Calendar className="w-3 h-3" />
          {hasNextAction
            ? format(new Date(lead.next_action_date!), 'dd MMM', { locale: ptBR })
            : <span className="font-normal opacity-50">sem data</span>}
        </div>
        {lead.responsible ? (
          <AvatarNormal name={lead.responsible} status={lead.status} />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-niit-line" />
        )}
      </div>
    </div>
  );
}

/* ── Export ──────────────────────────────────────── */
export default function LeadCard({ lead, onClick, isDragging, density = 'compact' }: LeadCardProps) {
  if (density === 'comfortable') {
    return <ComfortableCard lead={lead} onClick={onClick} isDragging={isDragging} />;
  }
  return <CompactCard lead={lead} onClick={onClick} isDragging={isDragging} />;
}
