export type LeadStatus =
  | 'novo'
  | 'contato'
  | 'diagnostico'
  | 'proposta'
  | 'negociacao'
  | 'fechado'
  | 'perdido';

export type LeadCountry =
  | 'Brasil'
  | 'México'
  | 'Argentina'
  | 'Colômbia'
  | 'Paraguai'
  | 'Chile'
  | 'Peru'
  | 'Estados Unidos'
  | 'Outro';

export type LeadOrigin =
  | 'Feira'
  | 'Evento técnico'
  | 'Palestra'
  | 'Podcast'
  | 'LinkedIn'
  | 'Site'
  | 'Indicação'
  | 'WhatsApp'
  | 'E-mail'
  | 'Outro';

export type LeadInterest =
  | 'Nitretação a plasma'
  | 'Venda de máquina / reator de plasma'
  | 'Manutenção'
  | 'Consultoria técnica'
  | 'Palestra técnica'
  | 'Podcast / conteúdo técnico'
  | 'Parceria'
  | 'Outro';

export type InteractionType =
  | 'WhatsApp'
  | 'E-mail'
  | 'Ligação'
  | 'Reunião'
  | 'Feira'
  | 'Outro';

export interface Lead {
  id: string;
  company: string;
  contact_name: string;
  country: LeadCountry;
  whatsapp?: string;
  email?: string;
  role?: string;
  city?: string;
  region?: string;
  website?: string;
  status: LeadStatus;
  origin: LeadOrigin;
  interest: LeadInterest;
  responsible?: string;
  next_action?: string;
  next_action_date?: string;
  technical_notes?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  lead_id: string;
  date: string;
  type: InteractionType;
  description: string;
  next_step?: string;
  created_at: string;
}

export const PIPELINE_COLUMNS: { id: LeadStatus; label: string }[] = [
  { id: 'novo',        label: 'Novo Lead' },
  { id: 'contato',     label: 'Contato Iniciado' },
  { id: 'diagnostico', label: 'Diagnóstico Técnico' },
  { id: 'proposta',    label: 'Proposta Enviada' },
  { id: 'negociacao',  label: 'Negociação' },
  { id: 'fechado',     label: 'Fechado' },
  { id: 'perdido',     label: 'Perdido' },
];

export const COUNTRIES: LeadCountry[] = [
  'Brasil', 'México', 'Argentina', 'Colômbia', 'Paraguai',
  'Chile', 'Peru', 'Estados Unidos', 'Outro',
];

export const ORIGINS: LeadOrigin[] = [
  'Feira', 'Evento técnico', 'Palestra', 'Podcast', 'LinkedIn',
  'Site', 'Indicação', 'WhatsApp', 'E-mail', 'Outro',
];

export const INTERESTS: LeadInterest[] = [
  'Nitretação a plasma', 'Venda de máquina / reator de plasma',
  'Manutenção', 'Consultoria técnica', 'Palestra técnica',
  'Podcast / conteúdo técnico', 'Parceria', 'Outro',
];

export const INTERACTION_TYPES: InteractionType[] = [
  'WhatsApp', 'E-mail', 'Ligação', 'Reunião', 'Feira', 'Outro',
];
