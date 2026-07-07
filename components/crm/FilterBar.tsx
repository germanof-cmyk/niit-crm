'use client';

import { COUNTRIES, PIPELINE_COLUMNS, ORIGINS, INTERESTS } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, AlertTriangle, X } from 'lucide-react';

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
}

export default function FilterBar({ filters, onChange, responsibles, total, filtered }: FilterBarProps) {
  const set = (key: keyof Filters) => (val: string | null) =>
    onChange({ ...filters, [key]: !val || val === 'all' ? '' : val });

  const hasFilters = Object.values(filters).some(Boolean);

  const clear = () =>
    onChange({ country: '', status: '', origin: '', interest: '', responsible: '', overdue: '' });

  const isOverdueActive = filters.overdue === 'overdue';

  return (
    <div className="bg-white rounded-2xl border border-niit-line px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0">
        <Filter className="w-3.5 h-3.5" style={{ color: '#F7661E' }} />
        <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#1C4061' }}>
          Filtros
        </span>
      </div>

      <div className="w-px h-5 bg-niit-line shrink-0" />

      {/* Selects */}
      <Select value={filters.country || 'all'} onValueChange={set('country')}>
        <SelectTrigger className="w-32 h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="País" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os países</SelectItem>
          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.status || 'all'} onValueChange={set('status')}>
        <SelectTrigger className="w-40 h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {PIPELINE_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.origin || 'all'} onValueChange={set('origin')}>
        <SelectTrigger className="w-32 h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="Origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as origens</SelectItem>
          {ORIGINS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.interest || 'all'} onValueChange={set('interest')}>
        <SelectTrigger className="w-44 h-8 text-xs border-niit-line rounded-lg">
          <SelectValue placeholder="Interesse" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os interesses</SelectItem>
          {INTERESTS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
        </SelectContent>
      </Select>

      {responsibles.length > 0 && (
        <Select value={filters.responsible || 'all'} onValueChange={set('responsible')}>
          <SelectTrigger className="w-36 h-8 text-xs border-niit-line rounded-lg">
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150"
        style={
          isOverdueActive
            ? { background: '#FDECEC', borderColor: '#F4B4B4', color: '#DC2626' }
            : { background: 'white', borderColor: '#E3E8EF', color: '#64748B' }
        }
      >
        <AlertTriangle className="w-3 h-3" />
        Ação vencida
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
          Limpar filtros
        </button>
      )}

      {/* Counter */}
      {typeof total === 'number' && typeof filtered === 'number' && (
        <div className="ml-auto text-xs font-semibold" style={{ color: '#64748B' }}>
          {filtered} de {total} leads
        </div>
      )}
    </div>
  );
}
