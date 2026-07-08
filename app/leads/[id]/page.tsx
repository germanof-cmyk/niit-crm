'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLead, updateLead, deleteLead, createInteraction, deleteInteraction } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import LeadForm from '@/components/leads/LeadForm';
import InteractionForm from '@/components/leads/InteractionForm';
import { Lead, Interaction } from '@/lib/types';
import { ArrowLeft, ExternalLink, MessageSquare, Mail, Phone, Trash2, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';

const TYPE_ICONS: Record<string, string> = {
  WhatsApp: '💬', 'E-mail': '✉️', Ligação: '📞', Reunião: '🤝', Feira: '🏢', Outro: '📝',
};

function DetailSkeleton() {
  return (
    <div className="px-6 lg:px-8 pt-6 pb-4 max-w-3xl mx-auto space-y-4">
      <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
      <div className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
      <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl" />
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { lead, interactions, isLoading, error, mutate } = useLead(id);
  const [activeTab, setActiveTab] = useState<'historico' | 'editar'>('historico');
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return <AppShell><DetailSkeleton /></AppShell>;
  }

  if (error || !lead) {
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto">
          {error ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-100 bg-red-50 mb-4">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <p className="text-sm font-semibold text-red-700 flex-1">
                Não foi possível carregar o lead. Tente novamente.
              </p>
              <button
                onClick={() => mutate()}
                className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recarregar
              </button>
            </div>
          ) : (
            <p style={{ color: '#64748B' }}>Lead não encontrado.</p>
          )}
          <Link href="/leads">
            <Button variant="outline" className="mt-4 rounded-xl border-niit-line">
              Voltar para leads
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleUpdate = async (data: Omit<Lead, 'id' | 'order' | 'created_at' | 'updated_at'>) => {
    setSaving(true);
    try {
      await updateLead(lead.id, data);
      router.push('/leads');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Deseja excluir o lead "${lead.company}"? Esta ação não pode ser desfeita.`)) {
      await deleteLead(lead.id);
      router.push('/leads');
    }
  };

  const handleAddInteraction = async (data: Omit<Interaction, 'id' | 'created_at'>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lead_id, ...rest } = data;
    await createInteraction(lead.id, rest);
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    await deleteInteraction(interactionId, lead.id);
  };

  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <AppShell>
      <div>
        {/* Header — always visible, constrained */}
        <div className="px-6 lg:px-8 pt-6 pb-4 max-w-3xl mx-auto">
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 text-sm font-semibold mb-5 hover:opacity-70 transition-opacity"
            style={{ color: '#64748B' }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para leads
          </Link>

          {/* Lead header card */}
          <div
            className="rounded-2xl overflow-hidden mb-5 shadow-[0_4px_24px_rgba(19,45,70,0.18)]"
            style={{ background: 'linear-gradient(135deg, #132D46 0%, #1C4061 100%)' }}
          >
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#F7661E' }}>
                FICHA DO LEAD
              </p>
              <h1 className="text-xl font-extrabold text-white leading-tight">{lead.company}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <StatusBadge status={lead.status} />
                <span className="text-sm text-white/70">{lead.contact_name}</span>
                <span className="text-sm text-white/50">· {lead.country}</span>
              </div>
            </div>
            <div
              className="px-6 py-3 flex flex-wrap gap-4 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.12)' }}
            >
              {lead.whatsapp && (
                <span className="flex items-center gap-1.5 text-xs text-white/60">
                  <Phone className="w-3.5 h-3.5" /> {lead.whatsapp}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1.5 text-xs text-white/60">
                  <Mail className="w-3.5 h-3.5" /> {lead.email}
                </span>
              )}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs hover:underline"
                  style={{ color: '#FB8A4B' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> {lead.website}
                </a>
              )}
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-1 bg-white border border-niit-line rounded-xl p-1 w-fit">
            {(['historico', 'editar'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: activeTab === tab ? '#F4F6F9' : 'transparent',
                  color: activeTab === tab ? '#1C4061' : '#64748B',
                }}
              >
                {tab === 'historico' ? `Histórico (${interactions.length})` : 'Editar lead'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Histórico ── */}
        {activeTab === 'historico' && (
          <div className="px-6 lg:px-8 pb-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-niit-line shadow-card p-5 mb-5">
              <InteractionForm
                leadId={lead.id}
                onSubmit={handleAddInteraction}
              />
            </div>

            {sortedInteractions.length === 0 ? (
              <div className="flex flex-col items-center py-12 rounded-2xl bg-white border border-niit-line">
                <MessageSquare className="w-8 h-8 mb-2 opacity-20" style={{ color: '#1C4061' }} />
                <p className="text-sm" style={{ color: '#64748B' }}>Nenhum contato registrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedInteractions.map(interaction => (
                  <div
                    key={interaction.id}
                    className="bg-white rounded-xl border-l-[3px] border border-niit-line p-4"
                    style={{ borderLeftColor: '#F7661E' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{TYPE_ICONS[interaction.type] || '📝'}</span>
                        <div>
                          <span className="text-sm font-bold" style={{ color: '#1B2A3A' }}>
                            {interaction.type}
                          </span>
                          <span className="text-xs ml-2" style={{ color: '#64748B' }}>
                            {format(new Date(interaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteInteraction(interaction.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                      </button>
                    </div>
                    <p className="text-sm mt-2" style={{ color: '#1B2A3A' }}>
                      {interaction.description}
                    </p>
                    {interaction.next_step && (
                      <div
                        className="mt-2 flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg"
                        style={{ background: '#FEF0E8', color: '#C24E12' }}
                      >
                        <ChevronRight className="w-3 h-3 shrink-0" />
                        {interaction.next_step}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Editar — full width layout ── */}
        {activeTab === 'editar' && (
          <div className="px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
            <LeadForm
              initial={lead}
              onSubmit={handleUpdate}
              onCancel={() => setActiveTab('historico')}
              onDelete={handleDelete}
              saving={saving}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
