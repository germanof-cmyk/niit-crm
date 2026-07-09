'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/lib/types';
import LeadCard, { CardDensity } from '../leads/LeadCard';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ColumnDef { id: string; label: string }

export const COLUMN_COLORS: Record<string, string> = {
  novo:        '#1C4061',
  contato:     '#2E7CC4',
  diagnostico: '#0E9AA7',
  proposta:    '#6C5CE7',
  negociacao:  '#F7661E',
  fechado:     '#14A05A',
  perdido:     '#94A3B8',
};

function SortableLeadCard({
  lead,
  onClickLead,
  density,
}: {
  lead: Lead;
  onClickLead: (id: string) => void;
  density: CardDensity;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onClick={() => onClickLead(lead.id)} isDragging={isDragging} density={density} />
    </div>
  );
}

interface KanbanColumnProps {
  column: ColumnDef;
  leads: Lead[];
  onClickLead: (id: string) => void;
  collapsed?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  density?: CardDensity;
  /** Visual hint: auto-expand is about to fire (drag hover) */
  autoExpanding?: boolean;
}

/* ── Collapsed variant (44px wide) ──────────────── */
function CollapsedColumn({
  column,
  leads,
  onExpand,
  autoExpanding,
}: Pick<KanbanColumnProps, 'column' | 'leads' | 'onExpand' | 'autoExpanding'>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const color = COLUMN_COLORS[column.id] || '#1C4061';

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col items-center rounded-xl overflow-hidden"
      style={{
        width: '100%',
        background: autoExpanding ? '#E8EEF4' : '#EDF0F5',
        outline: isOver ? `2px dashed ${color}` : autoExpanding ? `2px dashed ${color}` : 'none',
        borderTop: `3px solid ${color}`,
        transition: 'background 150ms, outline 150ms',
      }}
    >
      {/* Lead count pill */}
      <div className="pt-2 pb-1 flex justify-center">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            background: `${color}2E`,
            color,
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Vertical label */}
      <div className="flex-1 flex items-center justify-center py-3">
        <span
          className="text-[11px] font-extrabold uppercase tracking-wider select-none"
          style={{
            color: '#1C4061',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            whiteSpace: 'nowrap',
          }}
        >
          {column.label}
        </span>
      </div>

      {/* Expand chevron */}
      <div className="pb-2 flex justify-center">
        <button
          type="button"
          onClick={onExpand}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/60"
          title="Expandir coluna"
        >
          <ChevronRight className="w-3.5 h-3.5 transition-colors" style={{ color: '#94A3B8' }} />
        </button>
      </div>
    </div>
  );
}

/* ── Expanded variant ────────────────────────────── */
function ExpandedColumn({
  column,
  leads,
  onClickLead,
  onCollapse,
  density = 'compact',
}: Required<Pick<KanbanColumnProps, 'column' | 'leads' | 'onClickLead' | 'density'>> &
  Pick<KanbanColumnProps, 'onCollapse'>) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const color = COLUMN_COLORS[column.id] || '#1C4061';

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        width: '100%',
        background: '#EDF0F5',
        outline: isOver ? `2px dashed #F7661E` : 'none',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-2 py-2 bg-white"
        style={{
          borderTop: `3px solid ${color}`,
          borderBottom: '1px solid #E3E8EF',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span
            className="text-[10px] font-extrabold uppercase tracking-wider truncate"
            style={{ color: '#1C4061' }}
          >
            {column.label}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="text-[10px] font-bold px-1.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {leads.length}
          </span>
          <button
            type="button"
            onClick={onCollapse}
            className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-niit-surface"
            title="Colapsar coluna"
          >
            <ChevronLeft className="w-3 h-3" style={{ color: '#94A3B8' }} />
          </button>
        </div>
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 px-1.5 py-1.5 space-y-1.5 min-h-32 transition-colors rounded-b-xl overflow-y-auto',
          isOver && 'bg-orange-50/60'
        )}
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        {leads.map(lead => (
          <SortableLeadCard
            key={lead.id}
            lead={lead}
            onClickLead={onClickLead}
            density={density}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────── */
export default function KanbanColumn({
  column,
  leads,
  onClickLead,
  collapsed = false,
  onCollapse,
  onExpand,
  density = 'compact',
  autoExpanding = false,
}: KanbanColumnProps) {
  if (collapsed) {
    return (
      <CollapsedColumn
        column={column}
        leads={leads}
        onExpand={onExpand}
        autoExpanding={autoExpanding}
      />
    );
  }
  return (
    <ExpandedColumn
      column={column}
      leads={leads}
      onClickLead={onClickLead}
      onCollapse={onCollapse}
      density={density}
    />
  );
}
