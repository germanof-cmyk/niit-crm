import { Lead, Interaction } from './types';

const LEADS_KEY = 'niit_crm_leads';
const INTERACTIONS_KEY = 'niit_crm_interactions';

export function getLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LEADS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function getInteractions(): Interaction[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(INTERACTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveInteractions(interactions: Interaction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
