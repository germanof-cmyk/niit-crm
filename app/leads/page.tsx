'use client';

import { useState, useMemo } from 'react';
import { useLeads } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, ChevronRight, AlertTriangle, Users } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import StatusBadge from '@/components/ui/StatusBadge';

export default function LeadsPage() {
  const { leads } = useLeads();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l =>
      !q ||
      l.company.toLowerCase().includes(q) ||
      l.contact_name.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q)
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads, search]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: '#1C4061' }}>Leads</h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              {leads.length} leads cadastrados
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748B' }} />
              <Input
                className="pl-9 w-64 rounded-xl border-niit-line text-sm h-9"
                placeholder="Buscar empresa, contato..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Link
              href="/leads/novo"
              className="btn-orange flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Lead
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {leads.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl bg-white"
            style={{ border: '2px dashed #D5DCE6' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: '#FEF0E8' }}
            >
              <Users className="w-7 h-7" style={{ color: '#F7661E' }} />
            </div>
            <p className="font-extrabold text-base mb-1" style={{ color: '#1C4061' }}>
              Nenhum lead cadastrado
            </p>
            <p className="text-sm mb-5" style={{ color: '#64748B' }}>
              Comece cadastrando seu primeiro lead no sistema
            </p>
            <Link
              href="/leads/novo"
              className="btn-orange px-5 py-2 rounded-xl text-sm"
            >
              Cadastrar primeiro lead
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-niit-line shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#1C4061' }}>
                  {['Empresa', 'Contato', 'País', 'Status', 'Interesse', 'Próx. ação', 'Responsável', ''].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.80)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-sm" style={{ color: '#64748B' }}>
                      Nenhum lead encontrado para &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                ) : (
                  filtered.map(lead => {
                    const isOverdue = lead.next_action_date &&
                      isPast(new Date(lead.next_action_date)) &&
                      !isToday(new Date(lead.next_action_date));
                    return (
                      <tr
                        key={lead.id}
                        className="border-t border-niit-line hover:bg-orange-50/40 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <p className="font-extrabold text-[13px]" style={{ color: '#1C4061' }}>
                            {lead.company}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium" style={{ color: '#1B2A3A' }}>{lead.contact_name}</p>
                          {lead.role && (
                            <p className="text-xs" style={{ color: '#64748B' }}>{lead.role}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#64748B' }}>{lead.country}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[160px]" style={{ color: '#64748B' }}>
                          {lead.interest.length > 28 ? lead.interest.slice(0, 28) + '…' : lead.interest}
                        </td>
                        <td className="px-4 py-3">
                          {lead.next_action_date ? (
                            <span
                              className="flex items-center gap-1 text-xs font-bold"
                              style={{ color: isOverdue ? '#DC2626' : '#64748B' }}
                            >
                              {isOverdue && <AlertTriangle className="w-3 h-3" />}
                              {lead.next_action_date}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: '#94A3B8' }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#64748B' }}>
                          {lead.responsible || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/leads/${lead.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-niit-surface transition-colors">
                              <ChevronRight className="w-4 h-4" style={{ color: '#64748B' }} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
