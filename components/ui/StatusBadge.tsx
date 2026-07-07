import { cn } from '@/lib/utils';
import { PIPELINE_COLUMNS } from '@/lib/types';

const STATUS_STYLES: Record<string, { bg: string; text: string; solid: string }> = {
  novo_lead:          { bg: 'rgba(28,64,97,0.12)',  text: '#1C4061', solid: '#1C4061' },
  contato_iniciado:   { bg: 'rgba(46,124,196,0.12)', text: '#2E7CC4', solid: '#2E7CC4' },
  diagnostico_tecnico:{ bg: 'rgba(14,154,167,0.12)', text: '#0E9AA7', solid: '#0E9AA7' },
  proposta_enviada:   { bg: 'rgba(108,92,231,0.12)', text: '#6C5CE7', solid: '#6C5CE7' },
  negociacao:         { bg: 'rgba(247,102,30,0.12)', text: '#F7661E', solid: '#F7661E' },
  fechado:            { bg: 'rgba(20,160,90,0.12)',  text: '#14A05A', solid: '#14A05A' },
  perdido:            { bg: 'rgba(148,163,184,0.18)', text: '#64748B', solid: '#94A3B8' },
};

export const STATUS_SOLID: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_STYLES).map(([k, v]) => [k, v.solid])
);

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['novo_lead'];
  const label = PIPELINE_COLUMNS.find(c => c.id === status)?.label || status;
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase', className)}
      style={{ background: style.bg, color: style.text }}
    >
      {label}
    </span>
  );
}
