'use client';

import { useRouter } from 'next/navigation';
import { useLeads } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import LeadForm from '@/components/leads/LeadForm';
import { Lead } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NovoLeadPage() {
  const router = useRouter();
  const { createLead } = useLeads();

  const handleSubmit = (data: Omit<Lead, 'id' | 'order' | 'created_at' | 'updated_at'>) => {
    createLead(data);
    router.push('/leads');
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 hover:opacity-70 transition-opacity"
          style={{ color: '#64748B' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para leads
        </Link>
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#F7661E' }}>
            NOVO LEAD
          </p>
          <h1 className="text-2xl font-extrabold" style={{ color: '#1C4061' }}>
            Cadastrar lead
          </h1>
        </div>
        <LeadForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/leads')}
        />
      </div>
    </AppShell>
  );
}
