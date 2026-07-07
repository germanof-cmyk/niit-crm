'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/lib/types';
import LeadCard from '../leads/LeadCard';
import { cn } from '@/lib/utils';

interface ColumnDef { id: string; label: string }

const COLUMN_COLORS: Record<string, string> = {
  novo_lead:           '#1C4061',
  contato_iniciado:    '#2E7CC4',
  diagnostico_tecnico: '#0E9AA7',
  proposta_enviada:    '#6C5CE7',
  negociacao:          '#F7661E',
  fechado:             '#14A05A',
  perdido:             '#94A3B8',
};

function SortableLeadCard({ lead, onClickLead }: { lead: Lead; onClickLead: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onClick={() => onClickLead(lead.id)} isDragging={isDragging} />
    </div>
  );
}

interface KanbanColumnProps {
  column: ColumnDef;
  leads: Lead[];
  onClickLead: (id: string) => void;
}

export default function KanbanColumn({ column, leads, onClickLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const color = COLUMN_COLORS[column.id] || '#1C4061';

  return (
    <div
      className="flex flex-col w-64 shrink-0 rounded-2xl overflow-hidden"
      style={{ background: '#EDF0F5', outline: isOver ? `2px dashed #F7661E` : 'none' }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-white border-b"
        style={{ borderTop: `3px solid ${color}`, borderBottom: '1px solid #E3E8EF' }}
      >
        <span
          className="text-[11px] font-extrabold uppercase tracking-wider"
          style={{ color: '#1C4061' }}
        >
          {column.label}
        </span>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: `${color}20`,
            color: color,
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 px-2 py-2 space-y-2 min-h-32 transition-colors rounded-b-2xl',
          isOver && 'bg-orange-50/60'
        )}
      >
        {leads.map(lead => (
          <SortableLeadCard key={lead.id} lead={lead} onClickLead={onClickLead} />
        ))}
      </div>
    </div>
  );
}
