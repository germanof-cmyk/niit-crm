'use client';

import { COUNTRIES, PIPELINE_COLUMNS, ORIGINS, INTERESTS } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardDensity } from '../leads/LeadCard';

export interface Filters {
  country: string;
  status: string;
  origin: string;
  interest: string;
  responsible: string;
  overdue: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  responsibles: string[];
  total?: number;
  filtered?: number;
  density?: CardDensity;
  onDensityChange?: (d: CardDensity) => void;
}

/* ── Density toggle ──────────────────────────────── */
function DensityToggle({
  density,
  onChange,
}: {
  density: CardDensity;
  onChange: (d: CardDensity) => void;
}) {
  return (
    <div
      className="flex items-center rounded-lg p-0.5 shrink-0"
      style={{ background: '#E3E8EF' }}
    >
      {(['compact', 'comfortable'] as const).map(d => {
        const active = density === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            title={d === 'compact' ? 'Compacto' : 'Confortável'}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150',
              active
                ? 'bg-white shadow-sm'
                : 'hover:bg-white/50'
            )}
            style={{ color: active ? '#1C4061' : '#94A3B8' }}
          >
            {d === 'compact' ? 'Compacto' : 'Confortável'}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterBar({
  filters,
  onChange,
  responsibles,
  total,
  filtered,
  density = 'compact',
  onDensityChange,
}: FilterBarProps) {
  // When a value is selected, use it. When cleared (value="all"), set to ''.
  // Pass value={filters.x || undefined} so placeholder shows when empty.
  const set = (key: keyof Filters) => (val: string | null) =>
    onChange({ ...filters, [key]: !val || val === 'all' ? '' : val });

  const hasFilters = Object.values(filters).some(Boolean);
  const clear = () =>
    onChange({ country: '', status: '', origin: '', interest: '', responsible: '', overdue: '' });
  const isOverdueActive = filters.overdue === 'overdue';

  return (
    <div className="bg-white rounded-2xl border border-niit-line px-4 py-3 flex flex-wrap items-center gap-2">
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0">
        <Filter className="w-3.5 h-3.5" style={{ color: '#F7661E' }} />
        <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#1C4061' }}>
          Filtros
        </span>
      </div>

      <div className="w-px h-5 bg-niit-line shrink-0" />

      {/* País */}
      <Select
        value={filters.country || undefined}
        onValueChange={set('country')}
      >
        <SelectTrigger className="w-[110px] h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="País" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os países</SelectItem>
          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status || undefined}
        onValueChange={set('status')}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {PIPELINE_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Origem */}
      <Select
        value={filters.origin || undefined}
        onValueChange={set('origin')}
      >
        <SelectTrigger className="w-[110px] h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as origens</SelectItem>
          {ORIGINS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Interesse */}
      <Select
        value={filters.interest || undefined}
        onValueChange={set('interest')}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="Interesse" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os interesses</SelectItem>
          {INTERESTS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Responsável */}
      {responsibles.length > 0 && (
        <Select
          value={filters.responsible || undefined}
          onValueChange={set('responsible')}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs border-niit-line rounded-lg">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {responsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* Overdue toggle */}
      <button
        type="button"
        onClick={() => set('overdue')(isOverdueActive ? 'all' : 'overdue')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150"
        style={
          isOverdueActive
            ? { background: '#FDECEC', borderColor: '#F4B4B4', color: '#DC2626' }
            : { background: 'white', borderColor: '#E3E8EF', color: '#64748B' }
        }
      >
        <AlertTriangle className="w-3 h-3" />
        Vencidas
      </button>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs font-bold transition-colors hover:opacity-80"
          style={{ color: '#F7661E' }}
        >
          <X className="w-3 h-3" />
          Limpar
        </button>
      )}

      {/* Right side: counter + density toggle */}
      <div className="ml-auto flex items-center gap-3">
        {typeof total === 'number' && typeof filtered === 'number' && (
          <span className="text-xs font-semibold hidden sm:block" style={{ color: '#64748B' }}>
            {filtered} de {total}
          </span>
        )}
        {onDensityChange && (
          <DensityToggle density={density} onChange={onDensityChange} />
        )}
      </div>
    </div>
  );
}
