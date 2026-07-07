'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Lead, LeadStatus, COUNTRIES, ORIGINS, INTERESTS, PIPELINE_COLUMNS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, MapPin, Target, Clock,
  Globe, MessageCircle, Mail, Trash2,
  Check, AlertCircle, Lightbulb, Calendar,
  CheckCircle2, Circle, ArrowLeft, Save,
} from 'lucide-react';
import { STATUS_SOLID } from '@/components/ui/StatusBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────── */
interface LeadFormProps {
  initial?: Partial<Lead>;
  onSubmit: (data: Omit<Lead, 'id' | 'order' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  /** When provided, renders the full page header (back link + eyebrow + title + progress). */
  backHref?: string;
}

/* ─── Constants ─────────────────────────────────────────── */
const STATUS_PILL: Record<string, { color: string; bg: string }> = {
  novo_lead:           { color: '#1C4061', bg: 'rgba(28,64,97,0.10)' },
  contato_iniciado:    { color: '#2E7CC4', bg: 'rgba(46,124,196,0.10)' },
  diagnostico_tecnico: { color: '#0E9AA7', bg: 'rgba(14,154,167,0.10)' },
  proposta_enviada:    { color: '#6C5CE7', bg: 'rgba(108,92,231,0.10)' },
  negociacao:          { color: '#F7661E', bg: 'rgba(247,102,30,0.10)' },
  fechado:             { color: '#14A05A', bg: 'rgba(20,160,90,0.10)' },
  perdido:             { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const COUNTRY_FLAGS: Record<string, string> = {
  'Brasil': '🇧🇷', 'México': '🇲🇽', 'Argentina': '🇦🇷',
  'Colômbia': '🇨🇴', 'Paraguai': '🇵🇾', 'Chile': '🇨🇱',
  'Peru': '🇵🇪', 'Estados Unidos': '🇺🇸', 'Outro': '🌍',
};

/* ─── Sub-components ─────────────────────────────────────── */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
      {children}
      {required && <span className="ml-0.5" style={{ color: '#F7661E' }}>*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold" style={{ color: '#EF4444' }}>
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </div>
  );
}

function InputWithIcon({
  icon: Icon,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ElementType;
  error?: boolean;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: '#94A3B8' }}
        />
      )}
      <Input
        {...props}
        className={cn(
          'h-9 text-sm rounded-lg transition-all duration-150',
          Icon ? 'pl-9' : '',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
            : 'border-niit-line focus:border-niit-orange focus:ring-2 focus:ring-niit-orange/20'
        )}
      />
    </div>
  );
}

function SectionCard({
  number,
  icon: Icon,
  title,
  subtitle,
  complete,
  children,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-niit-line shadow-card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-extrabold transition-all duration-300"
          style={{
            background: complete ? '#E7F6EE' : '#FEF0E8',
            color: complete ? '#14A05A' : '#F7661E',
          }}
        >
          {complete ? <Check className="w-3.5 h-3.5" /> : number}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-[15px] h-[15px] shrink-0" style={{ color: '#F7661E' }} />
            <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#1C4061' }}>
              {title}
            </span>
            <div style={{ width: 32, height: 3, background: '#F7661E', borderRadius: 9999, flexShrink: 0 }} />
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PillPicker<T extends string>({
  options,
  value,
  onChange,
  getLabel,
  getKey,
  selectedStyle,
  renderOption,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  getLabel: (o: T) => string;
  getKey: (o: T) => string;
  selectedStyle: (o: T) => React.CSSProperties;
  renderOption?: (o: T, selected: boolean) => React.ReactNode;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
      {options.map(opt => {
        const selected = value === opt;
        const key = getKey(opt);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0',
              'cursor-pointer transition-all duration-150 border',
              selected ? 'shadow-sm' : 'border-niit-line bg-white hover:border-niit-navy/30'
            )}
            style={{ scrollSnapAlign: 'start', ...(selected ? selectedStyle(opt) : { color: '#64748B' }) }}
          >
            {renderOption ? renderOption(opt, selected) : getLabel(opt)}
          </button>
        );
      })}
    </div>
  );
}

function LeadPreview({ form }: { form: ReturnType<typeof useFormState> }) {
  const hasDate = !!form.next_action_date;
  return (
    <div className="bg-white rounded-xl border border-niit-line overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(28,64,97,0.06)' }}>
      <div className="px-3 pt-3 pb-1">
        <StatusBadge status={form.status} className="mb-2" />
        <p className="font-extrabold text-[13px] leading-tight" style={{ color: form.company ? '#1C4061' : '#94A3B8' }}>
          {form.company || <em className="font-normal text-[#94A3B8]">—</em>}
        </p>
        <p className="text-[12px] mt-0.5" style={{ color: '#64748B' }}>
          {form.contact_name ? (
            <>
              {form.contact_name}
              {form.role && <span className="opacity-70"> · {form.role}</span>}
            </>
          ) : (
            <em className="font-normal opacity-60">—</em>
          )}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#F4F6F9', color: '#1C4061' }}>
            {form.country}
          </span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#FEF0E8', color: '#C24E12' }}>
            {form.interest.length > 20 ? form.interest.slice(0, 20) + '…' : form.interest}
          </span>
        </div>
        <div className="mt-1">
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#F4F6F9', color: '#64748B' }}>
            {form.origin}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 mt-2 border-t" style={{ borderColor: '#E3E8EF' }}>
        <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: hasDate ? '#64748B' : '#94A3B8' }}>
          <Calendar className="w-3 h-3" />
          {hasDate ? form.next_action_date : 'sem data'}
        </span>
        {form.responsible ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: STATUS_SOLID[form.status] || '#1C4061' }}
          >
            <span className="text-white font-bold" style={{ fontSize: 9 }}>
              {form.responsible.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed" style={{ borderColor: '#E3E8EF' }} />
        )}
      </div>
    </div>
  );
}

function RequiredChecklist({ form }: { form: ReturnType<typeof useFormState> }) {
  const fields = [
    { label: 'Empresa', ok: !!form.company },
    { label: 'Nome do contato', ok: !!form.contact_name },
    { label: 'País', ok: !!form.country },
    { label: 'Status', ok: !!form.status },
    { label: 'Origem', ok: !!form.origin },
    { label: 'Interesse', ok: !!form.interest },
  ];
  const filled = fields.filter(f => f.ok).length;
  const allDone = filled === fields.length;
  return (
    <div className="bg-white rounded-2xl border border-niit-line shadow-card p-5">
      <p className="text-[11px] font-extrabold uppercase tracking-wider mb-3" style={{ color: '#1C4061' }}>
        Checklist
      </p>
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.label} className="flex items-center gap-2">
            {f.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#14A05A' }} />
            ) : (
              <Circle className="w-4 h-4 shrink-0" style={{ color: '#CBD5E1' }} />
            )}
            <span className="text-xs font-medium" style={{ color: f.ok ? '#1B2A3A' : '#94A3B8' }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-niit-line">
        <p className="text-xs font-semibold" style={{ color: allDone ? '#14A05A' : '#C24E12' }}>
          {allDone
            ? `✓ ${fields.length} de ${fields.length} obrigatórios preenchidos`
            : `Faltam ${fields.length - filled} obrigatório${fields.length - filled > 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
}

/* ─── Hook for form state ────────────────────────────────── */
function useFormState(initial?: Partial<Lead>) {
  const [company, setCompany] = useState(initial?.company || '');
  const [contact_name, setContactName] = useState(initial?.contact_name || '');
  const [country, setCountry] = useState(initial?.country || 'Brasil');
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [role, setRole] = useState(initial?.role || '');
  const [city, setCity] = useState(initial?.city || '');
  const [region, setRegion] = useState(initial?.region || '');
  const [website, setWebsite] = useState(initial?.website || '');
  const [status, setStatus] = useState<LeadStatus>(initial?.status || 'novo_lead');
  const [origin, setOrigin] = useState(initial?.origin || 'Feira');
  const [interest, setInterest] = useState(initial?.interest || 'Nitretação a plasma');
  const [responsible, setResponsible] = useState(initial?.responsible || '');
  const [next_action, setNextAction] = useState(initial?.next_action || '');
  const [next_action_date, setNextActionDate] = useState(initial?.next_action_date || '');
  const [technical_notes, setTechnicalNotes] = useState(initial?.technical_notes || '');

  return {
    company, setCompany,
    contact_name, setContactName,
    country, setCountry,
    whatsapp, setWhatsapp,
    email, setEmail,
    role, setRole,
    city, setCity,
    region, setRegion,
    website, setWebsite,
    status, setStatus,
    origin, setOrigin,
    interest, setInterest,
    responsible, setResponsible,
    next_action, setNextAction,
    next_action_date, setNextActionDate,
    technical_notes, setTechnicalNotes,
  };
}

/* ─── Progress bar ───────────────────────────────────────── */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-[2px] rounded-full" style={{ background: '#E3E8EF' }}>
      <div
        className="h-[2px] rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F7661E, #FB8A4B)' }}
      />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function LeadForm({ initial, onSubmit, onCancel, onDelete, backHref }: LeadFormProps) {
  const form = useFormState(initial);
  const [errors, setErrors] = useState<{ company?: string; contact_name?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const isEditing = !!initial?.id;

  /* Progress */
  const allValues = [
    form.company, form.contact_name, form.country, form.whatsapp, form.email,
    form.role, form.city, form.region, form.website, form.status,
    form.origin, form.interest, form.responsible, form.next_action,
    form.next_action_date, form.technical_notes,
  ];
  const filledCount = allValues.filter(v => !!v).length;
  const totalFields = allValues.length;
  const progressPct = Math.round((filledCount / totalFields) * 100);

  /* Section completion */
  const sec1Done = !!form.company && !!form.contact_name;
  const sec2Done = !!form.country;
  const sec3Done = !!form.status && !!form.origin && !!form.interest;
  const sec4Done = !!form.next_action && !!form.next_action_date;

  /* isDirty */
  const isDirty = useMemo(() => {
    if (!isEditing) return form.company !== '' || form.contact_name !== '';
    return (
      form.company !== (initial?.company || '') ||
      form.contact_name !== (initial?.contact_name || '') ||
      form.country !== (initial?.country || 'Brasil') ||
      form.whatsapp !== (initial?.whatsapp || '') ||
      form.email !== (initial?.email || '') ||
      form.role !== (initial?.role || '') ||
      form.city !== (initial?.city || '') ||
      form.region !== (initial?.region || '') ||
      form.website !== (initial?.website || '') ||
      form.status !== (initial?.status || 'novo_lead') ||
      form.origin !== (initial?.origin || 'Feira') ||
      form.interest !== (initial?.interest || 'Nitretação a plasma') ||
      form.responsible !== (initial?.responsible || '') ||
      form.next_action !== (initial?.next_action || '') ||
      form.next_action_date !== (initial?.next_action_date || '') ||
      form.technical_notes !== (initial?.technical_notes || '')
    );
  }, [form, initial, isEditing]);

  /* Keyboard shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!form.company.trim()) newErrors.company = 'Campo obrigatório';
    if (!form.contact_name.trim()) newErrors.contact_name = 'Campo obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      companyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    showToast(isEditing ? 'Lead atualizado com sucesso!' : 'Lead criado com sucesso!');

    const data = {
      company: form.company,
      contact_name: form.contact_name,
      country: form.country as Lead['country'],
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      role: form.role || undefined,
      city: form.city || undefined,
      region: form.region || undefined,
      website: form.website || undefined,
      status: form.status as LeadStatus,
      origin: form.origin as Lead['origin'],
      interest: form.interest as Lead['interest'],
      responsible: form.responsible || undefined,
      next_action: form.next_action || undefined,
      next_action_date: form.next_action_date || undefined,
      technical_notes: form.technical_notes || undefined,
    };

    setTimeout(() => onSubmit(data), 700);
  };

  const allRequired = !!form.company && !!form.contact_name;

  return (
    <>
      {/* Toast */}
      {toastVisible && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl transition-all"
          style={{ background: '#132D46', border: '1px solid rgba(247,102,30,0.3)' }}
        >
          <Check className="w-4 h-4" style={{ color: '#F7661E' }} />
          {toastMsg}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate>

        {/* ── Page header (full) — shown when backHref is provided ── */}
        {backHref ? (
          <div className="mb-8">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold mb-5 transition-colors hover:text-niit-navy"
              style={{ color: '#64748B' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para leads
            </Link>

            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1" style={{ color: '#F7661E' }}>
                  {isEditing ? 'EDITAR LEAD' : 'NOVO LEAD'}
                </p>
                <h1 className="text-2xl font-extrabold leading-tight" style={{ color: '#1C4061' }}>
                  {isEditing ? (initial?.company || 'Editar lead') : 'Cadastrar lead'}
                </h1>
              </div>
              <span className="text-sm font-semibold shrink-0 pb-0.5" style={{ color: '#94A3B8' }}>
                {filledCount} de {totalFields} campos preenchidos
              </span>
            </div>

            <ProgressBar pct={progressPct} />
          </div>
        ) : (
          /* ── Minimal progress bar — for edit tab context ── */
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: '#64748B' }}>
                {filledCount} de {totalFields} campos preenchidos
              </span>
              <span className="text-xs font-bold" style={{ color: '#F7661E' }}>{progressPct}%</span>
            </div>
            <ProgressBar pct={progressPct} />
          </div>
        )}

        {/* ── 12-col grid ── */}
        <div className="grid grid-cols-12 gap-6">

          {/* ── Left column: 4 section cards ── */}
          <div className="col-span-12 lg:col-span-8 space-y-4">

            {/* Section 01: Identificação */}
            <SectionCard
              number="01"
              icon={Building2}
              title="Identificação"
              subtitle="Quem é a empresa e o contato principal"
              complete={sec1Done}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2" ref={companyRef}>
                  <FieldLabel required>Empresa</FieldLabel>
                  <InputWithIcon
                    icon={Building2}
                    value={form.company}
                    onChange={e => { form.setCompany(e.target.value); if (errors.company) setErrors(er => ({ ...er, company: undefined })); }}
                    placeholder="Nome da empresa"
                    error={!!errors.company}
                  />
                  <FieldError message={errors.company} />
                </div>
                <div>
                  <FieldLabel required>Nome do contato</FieldLabel>
                  <InputWithIcon
                    value={form.contact_name}
                    onChange={e => { form.setContactName(e.target.value); if (errors.contact_name) setErrors(er => ({ ...er, contact_name: undefined })); }}
                    placeholder="Nome completo"
                    error={!!errors.contact_name}
                  />
                  <FieldError message={errors.contact_name} />
                </div>
                <div>
                  <FieldLabel>Cargo</FieldLabel>
                  <InputWithIcon
                    value={form.role}
                    onChange={e => form.setRole(e.target.value)}
                    placeholder="Ex: Engenheiro de processos"
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Site da empresa</FieldLabel>
                  <InputWithIcon
                    icon={Globe}
                    value={form.website}
                    onChange={e => form.setWebsite(e.target.value)}
                    placeholder="https://empresa.com"
                    type="url"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Section 02: Localização e contato */}
            <SectionCard
              number="02"
              icon={MapPin}
              title="Localização e contato"
              subtitle="Como e onde chegar até o lead"
              complete={sec2Done}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>País</FieldLabel>
                  <Select value={form.country} onValueChange={v => form.setCountry(v as Lead['country'])}>
                    <SelectTrigger className="h-9 text-sm rounded-lg border-niit-line focus:border-niit-orange">
                      <SelectValue>
                        {COUNTRY_FLAGS[form.country]} {form.country}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>
                          {COUNTRY_FLAGS[c]} {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Cidade</FieldLabel>
                  <InputWithIcon
                    value={form.city}
                    onChange={e => form.setCity(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <FieldLabel>Estado / Região</FieldLabel>
                  <InputWithIcon
                    value={form.region}
                    onChange={e => form.setRegion(e.target.value)}
                    placeholder="Ex: SP, Mendoza"
                  />
                </div>
                <div>
                  <FieldLabel>WhatsApp</FieldLabel>
                  <InputWithIcon
                    icon={MessageCircle}
                    value={form.whatsapp}
                    onChange={e => form.setWhatsapp(e.target.value)}
                    placeholder="+55 (00) 00000-0000"
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel>E-mail</FieldLabel>
                  <InputWithIcon
                    icon={Mail}
                    value={form.email}
                    onChange={e => form.setEmail(e.target.value)}
                    type="email"
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Section 03: Qualificação comercial */}
            <SectionCard
              number="03"
              icon={Target}
              title="Qualificação comercial"
              subtitle="Como está o relacionamento e o que o lead quer"
              complete={sec3Done}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status pills */}
                <div className="col-span-2">
                  <FieldLabel required>Status</FieldLabel>
                  <PillPicker
                    options={PIPELINE_COLUMNS.map(c => c.id) as LeadStatus[]}
                    value={form.status}
                    onChange={form.setStatus}
                    getLabel={id => PIPELINE_COLUMNS.find(c => c.id === id)?.label || id}
                    getKey={id => id}
                    selectedStyle={id => ({
                      border: `2px solid ${STATUS_PILL[id]?.color || '#1C4061'}`,
                      background: STATUS_PILL[id]?.bg || 'rgba(28,64,97,0.10)',
                      color: STATUS_PILL[id]?.color || '#1C4061',
                    })}
                    renderOption={(id) => (
                      <>
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: STATUS_PILL[id]?.color || '#1C4061' }}
                        />
                        {PIPELINE_COLUMNS.find(c => c.id === id)?.label || id}
                      </>
                    )}
                  />
                </div>

                {/* Origin pills */}
                <div className="col-span-2">
                  <FieldLabel required>Origem do lead</FieldLabel>
                  <PillPicker
                    options={ORIGINS as Lead['origin'][]}
                    value={form.origin as Lead['origin']}
                    onChange={v => form.setOrigin(v)}
                    getLabel={o => o}
                    getKey={o => o}
                    selectedStyle={() => ({
                      border: '2px solid #1C4061',
                      background: '#E8EEF4',
                      color: '#1C4061',
                    })}
                  />
                </div>

                {/* Interest pills */}
                <div className="col-span-2">
                  <FieldLabel required>Interesse principal</FieldLabel>
                  <PillPicker
                    options={INTERESTS as Lead['interest'][]}
                    value={form.interest as Lead['interest']}
                    onChange={v => form.setInterest(v)}
                    getLabel={i => i}
                    getKey={i => i}
                    selectedStyle={() => ({
                      border: '2px solid #F7661E',
                      background: '#FEF0E8',
                      color: '#C24E12',
                    })}
                  />
                </div>

                {/* Responsável */}
                <div className="col-span-2">
                  <FieldLabel>Responsável interno</FieldLabel>
                  <InputWithIcon
                    value={form.responsible}
                    onChange={e => form.setResponsible(e.target.value)}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Section 04: Acompanhamento */}
            <SectionCard
              number="04"
              icon={Clock}
              title="Acompanhamento"
              subtitle="Próximo passo com esse lead"
              complete={sec4Done}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Próxima ação</FieldLabel>
                  <InputWithIcon
                    value={form.next_action}
                    onChange={e => form.setNextAction(e.target.value)}
                    placeholder="Ex.: enviar proposta técnica"
                  />
                </div>
                <div>
                  <FieldLabel>Data da próxima ação</FieldLabel>
                  <InputWithIcon
                    type="date"
                    value={form.next_action_date}
                    onChange={e => form.setNextActionDate(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Observações técnicas</FieldLabel>
                  <Textarea
                    value={form.technical_notes}
                    onChange={e => form.setTechnicalNotes(e.target.value)}
                    placeholder="Processo, material, aplicação, especificações técnicas..."
                    className="min-h-32 rounded-lg border-niit-line text-sm resize-none focus:border-niit-orange focus:ring-2 focus:ring-niit-orange/20 transition-all duration-150"
                  />
                </div>
              </div>
            </SectionCard>

          </div>

          {/* ── Right column: sidebar ── */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Card 1: Preview */}
              <div className="bg-white rounded-2xl border border-niit-line shadow-card p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94A3B8' }}>
                  PRÉVIA DO CARD
                </p>
                <p className="text-xs font-semibold mb-3" style={{ color: '#1C4061' }}>
                  Como o lead vai aparecer no kanban
                </p>
                <LeadPreview form={form} />
              </div>

              {/* Card 2: Checklist */}
              <RequiredChecklist form={form} />

              {/* Card 3: Dicas — só em novo lead */}
              {!isEditing && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: '#FEF0E8', border: '1px solid rgba(247,102,30,0.30)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4" style={{ color: '#F7661E' }} />
                    <span className="text-sm font-extrabold" style={{ color: '#C24E12' }}>Dica rápida</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                    Leads de feiras convertem melhor com follow-up em até 7 dias. Já defina a próxima ação e data antes de salvar.
                  </p>
                </div>
              )}

              {/* Keyboard shortcut hint */}
              <p className="text-center text-[11px]" style={{ color: '#94A3B8' }}>
                Dica:{' '}
                <kbd className="px-1 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#F4F6F9', color: '#64748B', border: '1px solid #E3E8EF' }}>Ctrl</kbd>
                {' '}+{' '}
                <kbd className="px-1 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#F4F6F9', color: '#64748B', border: '1px solid #E3E8EF' }}>Enter</kbd>
                {' '}para salvar
              </p>

            </div>
          </div>
        </div>

        {/* Spacer for fixed footer */}
        <div className="h-24" />

        {/* ── Fixed action bar ── */}
        <div
          className="fixed bottom-0 left-0 right-0 lg:left-[240px] z-20 border-t"
          style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderColor: '#E3E8EF' }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            {/* Delete */}
            <div className="shrink-0">
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl transition-colors hover:bg-red-50"
                  style={{ color: '#DC2626' }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Excluir lead</span>
                </button>
              ) : <div />}
            </div>

            {/* Unsaved changes indicator */}
            {isEditing && isDirty && (
              <div className="hidden md:flex items-center gap-2 text-xs font-semibold" style={{ color: '#64748B' }}>
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#F7661E' }}
                />
                Alterações não salvas
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-niit-surface"
                style={{ borderColor: '#E3E8EF', color: '#64748B' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-extrabold text-white transition-all duration-150',
                  !allRequired ? 'opacity-60' : 'btn-orange'
                )}
                style={allRequired ? {} : { background: '#F7661E', boxShadow: 'none' }}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {isEditing ? 'Salvar alterações' : 'Criar lead'}
              </button>
            </div>
          </div>
        </div>

      </form>
    </>
  );
}
