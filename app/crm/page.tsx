'use client';

import { useState, useMemo } from 'react';
import { useLeads } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import KanbanBoard from '@/components/crm/KanbanBoard';
import FilterBar, { Filters } from '@/components/crm/FilterBar';
import { isPast, isToday } from 'date-fns';
import { Lead } from '@/lib/types';

export default function CrmPage() {
  const { leads, updateLead, updateLeadsOrder } = useLeads();
  const [filters, setFilters] = useState<Filters>({
    country: '', status: '', origin: '', interest: '', responsible: '', overdue: '',
  });

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

  const handleUpdateLead = (id: string, data: Partial<Lead>) => {
    updateLead(id, data);
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 lg:px-8 py-5 border-b border-niit-line bg-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: '#1C4061' }}>Pipeline CRM</h1>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                {filtered.length} leads no pipeline
              </p>
            </div>
          </div>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            responsibles={responsibles}
            total={leads.length}
            filtered={filtered.length}
          />
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-hidden p-4 lg:p-6">
          <KanbanBoard
            leads={filtered}
            onUpdateLead={handleUpdateLead}
            onUpdateOrder={updateLeadsOrder}
          />
        </div>
      </div>
    </AppShell>
  );
}
