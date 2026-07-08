'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLead } from '@/lib/hooks';
import AppShell from '@/components/layout/AppShell';
import LeadForm from '@/components/leads/LeadForm';
import { Lead } from '@/lib/types';

export default function NovoLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: Omit<Lead, 'id' | 'order' | 'created_at' | 'updated_at'>) => {
    setSaving(true);
    try {
      await createLead(data);
      router.push('/leads');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <LeadForm
          backHref="/leads"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/leads')}
          saving={saving}
        />
      </div>
    </AppShell>
  );
}
