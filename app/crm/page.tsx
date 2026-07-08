'use client';

import { useState, useMemo } from 'react';
import { useLeads, reorderLeads } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import KanbanBoard from '@/components/crm/KanbanBoard';
import FilterBar, { Filters } from '@/components/crm/FilterBar';
import { isPast, isToday } from 'date-fns';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PIPELINE_COLUMNS } from '@/lib/types';
import { CardDensity } from '@/components/leads/LeadCard';

/* ── Helpers ─────────────────────────────────────── */
function pluralLeads(n: number) {
  if (n === 0) return 'Nenhum lead no pipeline';
  if (n === 1) return '1 lead no pipeline';
  return `${n} leads no pipeline`;
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-2 h-full overflow-x-auto pb-4 items-start">
      {PIPELINE_COLUMNS.map(col => (
        <div key={col.id} className="shrink-0" style={{ width: 208 }}>
          <div className="h-7 rounded-lg bg-slate-100 animate-pulse mb-2" />
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-100 bg-red-50 mb-4">
      <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
      <p className="text-sm font-semibold text-red-700 flex-1">
        Não foi possível carregar os leads. Tente novamente.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Recarregar
      </button>
    </div>
  );
}

export default function CrmPage() {
  const { leads, isLoading, error, mutate } = useLeads();

  const [filters, setFilters] = useState<Filters>({
    country: '', status: '', origin: '', interest: '', responsible: '', overdue: '',
  });

  const [density, setDensity] = useState<CardDensity>(() => {
    if (typeof window === 'undefined') return 'compact';
    return (localStorage.getItem('niit-crm-density') as CardDensity) || 'compact';
  });

  const handleDensityChange = (d: CardDensity) => {
    setDensity(d);
    localStorage.setItem('niit-crm-density', d);
  };

  const responsibles = useMemo(() => {
    const set = new Set(leads.map(l => l.responsible).filter(Boolean) as string[]);
    return Array.from(set);
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter(lead => {
      if (filters.country && lead.country !== filters.country) return false;
      if (filters.status && lead.status !== filters.status) return false;
      if (filters.origin && lead.origin !== filters.origin) return false;
      if (filters.interest && lead.interest !== filters.interest) return false;
      if (filters.responsible && lead.responsible !== filters.responsible) return false;
      if (filters.overdue === 'overdue') {
        if (!lead.next_action_date) return false;
        if (!isPast(new Date(lead.next_action_date)) || isToday(new Date(lead.next_action_date))) return false;
      }
      return true;
    });
  }, [leads, filters]);

  const handleDrop = async (updates: { id: string; status: string; order: number }[]) => {
    try {
      await reorderLeads(updates);
    } finally {
      await mutate();
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 lg:px-8 py-5 border-b border-niit-line bg-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: '#1C4061' }}>Pipeline CRM</h1>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                {isLoading ? 'Carregando…' : pluralLeads(filtered.length)}
              </p>
            </div>
          </div>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            responsibles={responsibles}
            total={leads.length}
            filtered={filtered.length}
            density={density}
            onDensityChange={handleDensityChange}
          />
        </div>

        {/* Board */}
        <div className="flex-1 overflow-hidden px-4 lg:px-6 pt-4">
          {error && <ErrorCard onRetry={mutate} />}
          {isLoading ? (
            <KanbanSkeleton />
          ) : (
            <KanbanBoard
              leads={filtered}
              onDrop={handleDrop}
              density={density}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
