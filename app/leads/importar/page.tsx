'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { Upload, Download, ArrowLeft, AlertTriangle, CheckCircle2, Loader2, FileText } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { COUNTRIES, ORIGINS, INTERESTS, PIPELINE_COLUMNS } from '@/lib/types';
import type { Lead, LeadStatus, LeadOrigin, LeadInterest, LeadCountry } from '@/lib/types';
import { detectMapping, normalizeCountry } from '@/lib/csv-mapping';
import type { CsvField } from '@/lib/csv-mapping';
import { mutate as globalMutate } from 'swr';

/* ── Types ────────────────────────────────────────────────── */

interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
}

interface Defaults {
  country:  LeadCountry;
  status:   LeadStatus;
  origin:   LeadOrigin | '';
  interest: LeadInterest | '';
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string; data: Partial<Lead> }[];
}

/* ── Constants ────────────────────────────────────────────── */

const FIELD_LABELS: Record<CsvField, string> = {
  company:         'Empresa',
  contact_name:    'Nome do contato',
  email:           'E-mail',
  whatsapp:        'WhatsApp',
  role:            'Cargo',
  city:            'Cidade',
  region:          'Estado',
  country:         'País',
  website:         'Site',
  technical_notes: 'Observações',
  skip:            'Ignorar',
};

const ALL_FIELDS: CsvField[] = [
  'skip', 'company', 'contact_name', 'email', 'whatsapp',
  'role', 'city', 'region', 'country', 'website', 'technical_notes',
];

const TEMPLATE_CSV = `empresa,nome,email,whatsapp,cargo,cidade,estado,pais,site,observacoes
"Metalúrgica Exemplo Ltda","João Silva","joao@exemplo.com.br","+55 (11) 99999-0001","Engenheiro de Processos","São Paulo","SP","Brasil","https://metalurgica.com.br","Interesse em nitretação de aços ferramenta"
"Industria Modelo S.A.","María García","maria@modelo.com.mx","+52 55 1234-5678","Gerente de Produção","Ciudad de México","CDMX","México","https://industriamodelo.mx","Participou de feira de metalurgia"`;

/* ── Helper: download CSV ─────────────────────────────────── */

function downloadCsv(content: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Step indicator ───────────────────────────────────────── */

function StepIndicator({ step }: { step: number }) {
  const steps = ['Upload', 'Mapeamento', 'Configurações', 'Confirmar'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, idx) => {
        const n = idx + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all"
                style={{
                  background: done ? '#14A05A' : active ? '#F7661E' : '#E3E8EF',
                  color: done || active ? '#fff' : '#94A3B8',
                }}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span
                className="text-[10px] font-bold mt-1 hidden sm:block"
                style={{ color: active ? '#F7661E' : done ? '#14A05A' : '#94A3B8' }}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="h-[2px] w-12 sm:w-16 mx-1 mb-4 sm:mb-0 transition-all"
                style={{ background: done ? '#14A05A' : '#E3E8EF' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1: Upload ───────────────────────────────────────── */

function Step1Upload({
  onNext,
}: {
  onNext: (data: CsvData) => void;
}) {
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError('');
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      if (result.errors.length > 0 && result.data.length === 0) {
        setError('Não foi possível ler o CSV.');
        return;
      }
      if (result.data.length === 0) {
        setError('Não foi possível ler o CSV.');
        return;
      }
      if (result.data.length > 500) {
        setError('Máximo 500 leads por importação. Divida em partes.');
        return;
      }
      const headers = result.meta.fields ?? Object.keys(result.data[0] ?? {});
      onNext({ headers, rows: result.data });
    };
    reader.onerror = () => setError('Erro ao ler o arquivo.');
    reader.readAsText(file, 'UTF-8');
  }, [onNext]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 px-6 transition-all"
        style={{
          borderColor: dragging ? '#F7661E' : '#D5DCE6',
          background: dragging ? '#FEF0E8' : '#FAFBFC',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: dragging ? '#FEF0E8' : '#F4F6F9' }}
        >
          <Upload className="w-8 h-8" style={{ color: dragging ? '#F7661E' : '#94A3B8' }} />
        </div>
        <p className="text-base font-extrabold mb-1" style={{ color: '#1C4061' }}>
          Arraste seu CSV aqui ou clique para selecionar
        </p>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Apenas arquivos .csv · Máximo 5 MB · Até 500 linhas
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm font-semibold" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      {/* Template */}
      <div className="bg-white rounded-2xl border border-niit-line shadow-card p-5">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 shrink-0" style={{ color: '#F7661E' }} />
          <div className="flex-1">
            <p className="text-sm font-extrabold" style={{ color: '#1C4061' }}>Modelo de CSV</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Não sabe o formato? Baixe nosso modelo.</p>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(TEMPLATE_CSV, 'modelo-leads-niit.csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-niit-surface"
            style={{ borderColor: '#1C4061', color: '#1C4061' }}
          >
            <Download className="w-4 h-4" />
            Baixar modelo CSV
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Step 2: Mapping ──────────────────────────────────────── */

function Step2Mapping({
  csvData,
  mapping,
  setMapping,
  onBack,
  onNext,
}: {
  csvData: CsvData;
  mapping: Record<string, CsvField>;
  setMapping: (m: Record<string, CsvField>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const hasCompany      = Object.values(mapping).includes('company');
  const hasContactName  = Object.values(mapping).includes('contact_name');
  const canContinue     = hasCompany && hasContactName;

  const setField = (header: string, field: CsvField) => {
    setMapping({ ...mapping, [header]: field });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold" style={{ color: '#1C4061' }}>Mapeie as colunas do seu arquivo</h2>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          Nosso sistema tentou identificar automaticamente. Ajuste se necessário.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-niit-line shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#F4F6F9' }}>
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: '#64748B' }}>
                Coluna no arquivo
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: '#64748B' }}>
                Campo no CRM
              </th>
            </tr>
          </thead>
          <tbody>
            {csvData.headers.map((header) => {
              const preview = csvData.rows
                .slice(0, 3)
                .map(r => r[header])
                .filter(Boolean)
                .join(', ');
              return (
                <tr key={header} className="border-t border-niit-line">
                  <td className="px-4 py-3">
                    <p className="font-bold text-sm" style={{ color: '#1C4061' }}>{header}</p>
                    {preview && (
                      <p className="text-xs mt-0.5 italic" style={{ color: '#94A3B8' }}>
                        {preview.length > 60 ? preview.slice(0, 60) + '…' : preview}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={mapping[header] ?? 'skip'}
                      onValueChange={(v) => setField(header, v as CsvField)}
                    >
                      <SelectTrigger className="h-9 text-sm rounded-lg border-niit-line w-full max-w-[240px]">
                        <SelectValue>{FIELD_LABELS[mapping[header] ?? 'skip']}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_FIELDS.map(f => (
                          <SelectItem key={f} value={f}>{FIELD_LABELS[f]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Warning */}
      {!canContinue && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#D97706' }} />
          <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
            Você precisa mapear pelo menos <strong>Empresa</strong> e <strong>Nome do contato</strong>
          </p>
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-niit-surface"
          style={{ borderColor: '#E3E8EF', color: '#64748B' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="px-6 py-2 rounded-xl text-sm font-extrabold text-white transition-all"
          style={{
            background: canContinue ? '#F7661E' : '#E3E8EF',
            color: canContinue ? '#fff' : '#94A3B8',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Defaults ─────────────────────────────────────── */

const STRATEGY_OPTIONS = [
  { value: 'skip',   label: 'Pular',          desc: 'Lead duplicado não será criado nem alterado.' },
  { value: 'update', label: 'Atualizar dados', desc: 'Os campos preenchidos no CSV sobrescreverão o lead existente.' },
  { value: 'create', label: 'Criar mesmo assim', desc: 'Um novo lead será criado mesmo que já exista outro igual.' },
] as const;

type Strategy = 'skip' | 'update' | 'create';

function Step3Defaults({
  defaults,
  setDefaults,
  strategy,
  setStrategy,
  onBack,
  onNext,
}: {
  defaults: Defaults;
  setDefaults: (d: Defaults) => void;
  strategy: Strategy;
  setStrategy: (s: Strategy) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const canContinue = !!defaults.origin && !!defaults.interest;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold" style={{ color: '#1C4061' }}>Preenchimento padrão</h2>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          Aplicaremos estes valores para leads que não tiverem essas informações.
        </p>
      </div>

      {/* Defaults grid */}
      <div className="bg-white rounded-2xl border border-niit-line shadow-card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Country */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
              País padrão
            </label>
            <Select
              value={defaults.country}
              onValueChange={(v) => setDefaults({ ...defaults, country: v as LeadCountry })}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-niit-line w-full">
                <SelectValue>{defaults.country}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
              Status padrão
            </label>
            <Select
              value={defaults.status}
              onValueChange={(v) => setDefaults({ ...defaults, status: v as LeadStatus })}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-niit-line w-full">
                <SelectValue>{PIPELINE_COLUMNS.find(c => c.id === defaults.status)?.label ?? defaults.status}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_COLUMNS.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
              Origem padrão <span style={{ color: '#F7661E' }}>*</span>
            </label>
            <Select
              value={defaults.origin || undefined}
              onValueChange={(v) => setDefaults({ ...defaults, origin: v as LeadOrigin })}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-niit-line w-full">
                <SelectValue placeholder="Selecione a origem">
                  {defaults.origin || 'Selecione a origem'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ORIGINS.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interest */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
              Interesse padrão <span style={{ color: '#F7661E' }}>*</span>
            </label>
            <Select
              value={defaults.interest || undefined}
              onValueChange={(v) => setDefaults({ ...defaults, interest: v as LeadInterest })}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-niit-line w-full">
                <SelectValue placeholder="Selecione o interesse">
                  {defaults.interest || 'Selecione o interesse'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INTERESTS.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Duplicate strategy */}
      <div className="bg-white rounded-2xl border border-niit-line shadow-card p-6">
        <h3 className="text-sm font-extrabold mb-1" style={{ color: '#1C4061' }}>Se o lead já existe</h3>
        <p className="text-xs mb-4" style={{ color: '#64748B' }}>
          Consideramos duplicado quando o e-mail é igual, ou quando empresa + nome do contato coincidem.
        </p>
        <div className="space-y-3">
          {STRATEGY_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all"
              style={{
                borderColor: strategy === opt.value ? '#F7661E' : '#E3E8EF',
                background: strategy === opt.value ? '#FEF0E8' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="strategy"
                value={opt.value}
                checked={strategy === opt.value}
                onChange={() => setStrategy(opt.value)}
                className="mt-0.5 accent-[#F7661E]"
              />
              <div>
                <p className="text-sm font-bold" style={{ color: '#1C4061' }}>{opt.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-niit-surface"
          style={{ borderColor: '#E3E8EF', color: '#64748B' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="px-6 py-2 rounded-xl text-sm font-extrabold transition-all"
          style={{
            background: canContinue ? '#F7661E' : '#E3E8EF',
            color: canContinue ? '#fff' : '#94A3B8',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Preview & Confirm ────────────────────────────── */

function buildLeads(
  csvData: CsvData,
  mapping: Record<string, CsvField>,
  defaults: Defaults,
): { lead: Partial<Lead>; error?: string }[] {
  return csvData.rows.map((row) => {
    const lead: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field !== 'skip' && row[header]) {
        lead[field] = row[header];
      }
    }

    // Apply defaults
    if (!lead.country)  lead.country  = defaults.country;
    if (!lead.status)   lead.status   = defaults.status;
    if (!lead.origin)   lead.origin   = defaults.origin;
    if (!lead.interest) lead.interest = defaults.interest;

    // Normalize country
    if (lead.country) lead.country = normalizeCountry(lead.country);

    // Validate required
    const missing = ['company', 'contact_name', 'country', 'status', 'origin', 'interest']
      .filter(f => !lead[f]);

    return {
      lead: lead as Partial<Lead>,
      error: missing.length > 0 ? `Campos faltando: ${missing.join(', ')}` : undefined,
    };
  });
}

function Step4Preview({
  csvData,
  mapping,
  defaults,
  strategy,
  onBack,
}: {
  csvData: CsvData;
  mapping: Record<string, CsvField>;
  defaults: Defaults;
  strategy: 'skip' | 'update' | 'create';
  onBack: () => void;
}) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const processed = buildLeads(csvData, mapping, defaults);
  const validLeads = processed.filter(p => !p.error).map(p => p.lead);
  const errorLeads = processed.filter(p => p.error);

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);

    const BATCH = 100;
    const batches: Partial<Lead>[][] = [];
    for (let i = 0; i < validLeads.length; i += BATCH) {
      batches.push(validLeads.slice(i, i + BATCH));
    }

    const accumulated: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (let i = 0; i < batches.length; i++) {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: batches[i], duplicateStrategy: strategy }),
      });
      const data: ImportResult = await res.json();
      accumulated.created  += data.created;
      accumulated.updated  += data.updated;
      accumulated.skipped  += data.skipped;
      accumulated.errors.push(...data.errors);
      setProgress(Math.round(((i + 1) / batches.length) * 100));
    }

    await globalMutate('/api/leads');
    setResult(accumulated);
    setIsImporting(false);
  };

  const downloadErrorReport = () => {
    if (!result) return;
    const rows = result.errors.map(e => ({
      Linha: e.row,
      Motivo: e.reason,
      Empresa: (e.data as Record<string, string>).company ?? '',
      Contato: (e.data as Record<string, string>).contact_name ?? '',
    }));
    const csv = Papa.unparse(rows, { quotes: true });
    downloadCsv(csv, 'erros-importacao-niit.csv');
  };

  // Success screen
  if (result) {
    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6" style={{ color: '#14A05A' }} />
            <h2 className="text-lg font-extrabold" style={{ color: '#14A05A' }}>Importação concluída!</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Criados',      value: result.created, color: '#14A05A' },
              { label: 'Atualizados',  value: result.updated, color: '#2E7CC4' },
              { label: 'Pulados',      value: result.skipped, color: '#64748B' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 text-center shadow-card">
                <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: '#64748B' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#D97706' }} />
              <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                {result.errors.length} linha(s) com erro
              </p>
            </div>
            <button
              onClick={downloadErrorReport}
              className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-amber-50"
              style={{ borderColor: '#D97706', color: '#92400E' }}
            >
              <Download className="w-3.5 h-3.5" />
              Baixar relatório
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => router.push('/leads')}
            className="px-6 py-2 rounded-xl text-sm font-extrabold text-white"
            style={{ background: '#F7661E' }}
          >
            Ir para Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold" style={{ color: '#1C4061' }}>Resumo da importação</h2>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Verifique os dados antes de confirmar.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total de linhas', value: processed.length, color: '#1C4061' },
          { label: 'Leads válidos',   value: validLeads.length, color: '#14A05A' },
          { label: 'Linhas com erro', value: errorLeads.length, color: errorLeads.length > 0 ? '#DC2626' : '#64748B' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 text-center border border-niit-line shadow-card">
            <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: '#64748B' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Preview table */}
      <div className="bg-white rounded-2xl border border-niit-line shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-niit-line" style={{ background: '#F4F6F9' }}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#64748B' }}>
            Primeiras {Math.min(10, processed.length)} linhas
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#1C4061' }}>
              {['Empresa', 'Contato', 'E-mail', 'País', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processed.slice(0, 10).map((p, idx) => (
              <tr
                key={idx}
                className="border-t border-niit-line"
                style={{ background: p.error ? '#FEF2F2' : 'transparent' }}
                title={p.error}
              >
                <td className="px-3 py-2 text-xs font-semibold" style={{ color: p.error ? '#DC2626' : '#1C4061' }}>
                  {(p.lead as Record<string, string>).company || '—'}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: '#64748B' }}>
                  {(p.lead as Record<string, string>).contact_name || '—'}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: '#64748B' }}>
                  {(p.lead as Record<string, string>).email || '—'}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: '#64748B' }}>
                  {(p.lead as Record<string, string>).country || '—'}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: '#64748B' }}>
                  {(p.lead as Record<string, string>).status || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error warning */}
      {errorLeads.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#D97706' }} />
          <p className="text-sm" style={{ color: '#92400E' }}>
            <strong>{errorLeads.length} lead(s)</strong> serão pulados por dados incompletos.
            Você pode continuar mesmo assim.
          </p>
        </div>
      )}

      {/* Progress bar */}
      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold" style={{ color: '#64748B' }}>
            <span>Importando…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E3E8EF' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #F7661E, #FB8A4B)' }}
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-niit-surface disabled:opacity-50"
          style={{ borderColor: '#E3E8EF', color: '#64748B' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting || validLeads.length === 0}
          className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-extrabold text-white transition-all disabled:opacity-50"
          style={{ background: '#F7661E' }}
        >
          {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
          Importar {validLeads.length} lead{validLeads.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function ImportarPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [mapping, setMapping] = useState<Record<string, CsvField>>({});
  const [defaults, setDefaults] = useState<Defaults>({
    country:  'Brasil',
    status:   'novo',
    origin:   '',
    interest: '',
  });
  const [strategy, setStrategy] = useState<'skip' | 'update' | 'create'>('skip');

  // Auto-detect mapping when moving to step 2
  useEffect(() => {
    if (step === 2 && csvData) {
      setMapping(detectMapping(csvData.headers));
    }
  }, [step, csvData]);

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-sm font-semibold mb-4 transition-colors hover:text-niit-navy"
            style={{ color: '#64748B' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <nav className="text-xs font-semibold mb-2" style={{ color: '#94A3B8' }}>
            <span>Leads</span>
            <span className="mx-1.5">/</span>
            <span style={{ color: '#1C4061' }}>Importar</span>
          </nav>
          <h1 className="text-2xl font-extrabold" style={{ color: '#1C4061' }}>Importar leads via CSV</h1>
        </div>

        <StepIndicator step={step} />

        {step === 1 && (
          <Step1Upload
            onNext={(data) => {
              setCsvData(data);
              setStep(2);
            }}
          />
        )}

        {step === 2 && csvData && (
          <Step2Mapping
            csvData={csvData}
            mapping={mapping}
            setMapping={setMapping}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Step3Defaults
            defaults={defaults}
            setDefaults={setDefaults}
            strategy={strategy}
            setStrategy={setStrategy}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && csvData && (
          <Step4Preview
            csvData={csvData}
            mapping={mapping}
            defaults={defaults}
            strategy={strategy}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </AppShell>
  );
}
