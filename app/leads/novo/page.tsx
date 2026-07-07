'use client';

import { useRouter } from 'next/navigation';
import { useLeads } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import LeadForm from '@/components/leads/LeadForm';
import { Lead } from '@/lib/types';

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
        <LeadForm
          backHref="/leads"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/leads')}
        />
      </div>
    </AppShell>
  );
}
