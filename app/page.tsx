'use client';

import { useMemo } from 'react';
import { useLeads } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import { PIPELINE_COLUMNS } from '@/lib/types';
import { isPast, isThisWeek, isToday } from 'date-fns';
import { Users, CheckCircle2, AlertTriangle, Clock, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const STATUS_SOLID: Record<string, string> = {
  novo:        '#1C4061',
  contato:     '#2E7CC4',
  diagnostico: '#0E9AA7',
  proposta:    '#6C5CE7',
  negociacao:  '#F7661E',
  fechado:     '#14A05A',
  perdido:     '#94A3B8',
};

interface KpiProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

function KpiCard({ label, value, icon, iconBg, valueColor }: KpiProps) {
  return (
    <div className="bg-white rounded-2xl border border-niit-line p-5 shadow-card flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold leading-none" style={{ color: valueColor || '#1C4061' }}>
          {value}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: '#64748B' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-[15px] h-[15px]" style={{ color: '#F7661E' }} />
      <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#1C4061' }}>
        {title}
      </span>
      <div style={{ width: 32, height: 3, background: '#F7661E', borderRadius: 9999 }} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="h-8 w-48 bg-slate-100 animate-pulse rounded mb-2" />
      <div className="h-4 w-64 bg-slate-100 animate-pulse rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-56 bg-slate-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-100 bg-red-50 mb-6">
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

export default function DashboardPage() {
  const { leads, isLoading, error, mutate } = useLeads();

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    PIPELINE_COLUMNS.forEach(col => { byStatus[col.id] = 0; });
    const byCountry: Record<string, number> = {};
    const byOrigin: Record<string, number> = {};

    const overdueLeads = leads.filter(l =>
      l.next_action_date && isPast(new Date(l.next_action_date)) && !isToday(new Date(l.next_action_date))
    );
    const thisWeekLeads = leads.filter(l =>
      l.next_action_date && isThisWeek(new Date(l.next_action_date), { weekStartsOn: 1 })
    );

    leads.forEach(l => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      byCountry[l.country] = (byCountry[l.country] || 0) + 1;
      byOrigin[l.origin] = (byOrigin[l.origin] || 0) + 1;
    });

    return { byStatus, byCountry, byOrigin, overdueLeads, thisWeekLeads };
  }, [leads]);

  const maxCount = leads.length || 1;

  if (isLoading) return <AppShell><DashboardSkeleton /></AppShell>;

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold" style={{ color: '#1C4061' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            Visão geral do pipeline comercial NIIT
          </p>
        </div>

        {error && <ErrorCard onRetry={mutate} />}

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total de leads"
            value={leads.length}
            iconBg="#E8EEF4"
            icon={<Users className="w-5 h-5" style={{ color: '#1C4061' }} />}
          />
          <KpiCard
            label="Leads fechados"
            value={stats.byStatus['fechado'] || 0}
            iconBg="#E7F6EE"
            valueColor="#14A05A"
            icon={<CheckCircle2 className="w-5 h-5" style={{ color: '#14A05A' }} />}
          />
          <KpiCard
            label="Ações vencidas"
            value={stats.overdueLeads.length}
            iconBg="#FDECEC"
            valueColor="#DC2626"
            icon={<AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />}
          />
          <KpiCard
            label="Ações esta semana"
            value={stats.thisWeekLeads.length}
            iconBg="#FEF0E8"
            valueColor="#F7661E"
            icon={<Clock className="w-5 h-5" style={{ color: '#F7661E' }} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* By Status */}
          <div className="bg-white rounded-2xl border border-niit-line p-5 shadow-card">
            <SectionHeader icon={CheckCircle2} title="Leads por status" />
            <div className="space-y-3">
              {PIPELINE_COLUMNS.map(col => {
                const count = stats.byStatus[col.id] || 0;
                const color = STATUS_SOLID[col.id] || '#1C4061';
                const pct = (count / maxCount) * 100;
                return (
                  <div key={col.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold" style={{ color: '#1B2A3A' }}>
                        {col.label}
                      </span>
                      <span className="text-[13px] font-extrabold" style={{ color: '#1C4061' }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#F4F6F9' }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Country */}
          <div className="bg-white rounded-2xl border border-niit-line p-5 shadow-card">
            <SectionHeader icon={Globe} title="Leads por país" />
            {Object.keys(stats.byCountry).length === 0 ? (
              <p className="text-xs" style={{ color: '#64748B' }}>Nenhum lead ainda</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byCountry)
                  .sort((a, b) => b[1] - a[1])
                  .map(([country, count]) => (
                    <div key={country}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold" style={{ color: '#1B2A3A' }}>{country}</span>
                        <span className="text-[13px] font-extrabold" style={{ color: '#1C4061' }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#F4F6F9' }}>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${(count / maxCount) * 100}%`, background: '#1C4061' }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* By Origin */}
          <div className="bg-white rounded-2xl border border-niit-line p-5 shadow-card">
            <SectionHeader icon={Users} title="Leads por origem" />
            {Object.keys(stats.byOrigin).length === 0 ? (
              <p className="text-xs" style={{ color: '#64748B' }}>Nenhum lead ainda</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byOrigin)
                  .sort((a, b) => b[1] - a[1])
                  .map(([origin, count]) => (
                    <div key={origin}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold" style={{ color: '#1B2A3A' }}>{origin}</span>
                        <span className="text-[13px] font-extrabold" style={{ color: '#1C4061' }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#F4F6F9' }}>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${(count / maxCount) * 100}%`, background: '#F7661E' }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Overdue + This Week */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue */}
          <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-card">
            <SectionHeader icon={AlertTriangle} title="Ações vencidas" />
            {stats.overdueLeads.length === 0 ? (
              <p className="text-xs" style={{ color: '#64748B' }}>Nenhuma ação vencida</p>
            ) : (
              <div className="space-y-1">
                {stats.overdueLeads.slice(0, 5).map(lead => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#1C4061' }}>{lead.company}</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>{lead.next_action}</p>
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#DC2626' }}>
                        {lead.next_action_date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* This Week */}
          <div className="bg-white rounded-2xl border border-niit-line p-5 shadow-card">
            <SectionHeader icon={Clock} title="Ações desta semana" />
            {stats.thisWeekLeads.length === 0 ? (
              <p className="text-xs" style={{ color: '#64748B' }}>Nenhuma ação programada esta semana</p>
            ) : (
              <div className="space-y-1">
                {stats.thisWeekLeads.slice(0, 5).map(lead => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-niit-surface transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#1C4061' }}>{lead.company}</p>
                        <p className="text-xs" style={{ color: '#64748B' }}>{lead.next_action}</p>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#64748B' }}>
                        {lead.next_action_date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
