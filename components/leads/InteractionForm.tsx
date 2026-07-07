'use client';

import { useState } from 'react';
import { Interaction, INTERACTION_TYPES } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SectionTitle from '@/components/ui/SectionTitle';
import { Megaphone } from 'lucide-react';

interface InteractionFormProps {
  leadId: string;
  onSubmit: (data: Omit<Interaction, 'id' | 'created_at'>) => void;
  onCancel?: () => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>
      {children}
    </label>
  );
}

export default function InteractionForm({ leadId, onSubmit, onCancel }: InteractionFormProps) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'WhatsApp' as Interaction['type'],
    description: '',
    next_step: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      lead_id: leadId,
      date: form.date,
      type: form.type,
      description: form.description,
      next_step: form.next_step || undefined,
    });
    setForm({ date: new Date().toISOString().slice(0, 10), type: 'WhatsApp', description: '', next_step: '' });
  };

  return (
    <div>
      <SectionTitle icon={Megaphone}>Registrar interação</SectionTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Data</FieldLabel>
            <Input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
              className="rounded-lg border-niit-line h-9 text-sm"
            />
          </div>
          <div>
            <FieldLabel>Tipo de contato</FieldLabel>
            <Select
              value={form.type}
              onValueChange={v => setForm(f => ({ ...f, type: (v ?? 'WhatsApp') as Interaction['type'] }))}
            >
              <SelectTrigger className="rounded-lg border-niit-line h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <FieldLabel>Descrição do contato</FieldLabel>
          <Textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
            placeholder="O que foi discutido neste contato?"
            rows={2}
            className="rounded-lg border-niit-line text-sm resize-none"
          />
        </div>
        <div>
          <FieldLabel>Próximo passo</FieldLabel>
          <Input
            value={form.next_step}
            onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))}
            placeholder="Ex: Aguardar retorno do cliente até sexta"
            className="rounded-lg border-niit-line h-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-niit-line text-niit-muted hover:bg-niit-surface transition-colors"
            >
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-orange px-4 py-2 rounded-xl text-sm">
            Adicionar ao histórico
          </button>
        </div>
      </form>
    </div>
  );
}
