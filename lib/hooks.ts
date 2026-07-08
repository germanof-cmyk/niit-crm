'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { Lead, Interaction } from './types';

/* ── Fetcher ─────────────────────────────────────── */

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/* ── Normalizers (ISO dates → YYYY-MM-DD, null → undefined) ── */

function isoToDate(v: unknown): string | undefined {
  if (!v || typeof v !== 'string') return undefined;
  return v.slice(0, 10);
}

function normalizeLead(raw: Record<string, unknown>): Lead {
  return {
    id: raw.id as string,
    company: raw.company as string,
    contact_name: raw.contact_name as string,
    country: raw.country as Lead['country'],
    status: raw.status as Lead['status'],
    origin: raw.origin as Lead['origin'],
    interest: raw.interest as Lead['interest'],
    order: (raw.order as number) ?? 0,
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
    whatsapp: (raw.whatsapp as string) ?? undefined,
    email: (raw.email as string) ?? undefined,
    role: (raw.role as string) ?? undefined,
    city: (raw.city as string) ?? undefined,
    region: (raw.region as string) ?? undefined,
    website: (raw.website as string) ?? undefined,
    responsible: (raw.responsible as string) ?? undefined,
    next_action: (raw.next_action as string) ?? undefined,
    next_action_date: raw.next_action_date ? isoToDate(raw.next_action_date) : undefined,
    technical_notes: (raw.technical_notes as string) ?? undefined,
  };
}

function normalizeInteraction(raw: Record<string, unknown>): Interaction {
  return {
    id: raw.id as string,
    lead_id: raw.lead_id as string,
    date: isoToDate(raw.date) ?? (raw.date as string),
    type: raw.type as Interaction['type'],
    description: raw.description as string,
    next_step: (raw.next_step as string) ?? undefined,
    created_at: raw.created_at as string,
  };
}

/* ── Hooks ───────────────────────────────────────── */

export function useLeads() {
  const { data, isLoading, error, mutate } = useSWR<Record<string, unknown>[]>(
    '/api/leads',
    fetcher
  );
  const leads = (data ?? []).map(normalizeLead);
  return { leads, isLoading, error, mutate };
}

export function useLead(id?: string) {
  const { data, isLoading, error, mutate } = useSWR<Record<string, unknown>>(
    id ? `/api/leads/${id}` : null,
    fetcher
  );
  const lead = data ? normalizeLead(data) : undefined;
  const interactions: Interaction[] = data?.interactions
    ? (data.interactions as Record<string, unknown>[]).map(normalizeInteraction)
    : [];
  return { lead, interactions, isLoading, error, mutate };
}

/* ── API helper ──────────────────────────────────── */

async function apiFetch<T = void>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ── Mutation functions ──────────────────────────── */

export async function createLead(
  data: Omit<Lead, 'id' | 'order' | 'created_at' | 'updated_at'>
): Promise<Lead> {
  const raw = await apiFetch<Record<string, unknown>>('/api/leads', 'POST', data);
  await globalMutate('/api/leads');
  return normalizeLead(raw);
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/leads/${id}`, 'PUT', data);
  await globalMutate('/api/leads');
  await globalMutate(`/api/leads/${id}`);
  return normalizeLead(raw);
}

export async function deleteLead(id: string): Promise<void> {
  await apiFetch(`/api/leads/${id}`, 'DELETE');
  await globalMutate('/api/leads');
}

export async function reorderLeads(
  updates: { id: string; status: string; order: number }[]
): Promise<void> {
  await apiFetch('/api/leads/reorder', 'POST', updates);
  await globalMutate('/api/leads');
}

export async function createInteraction(
  leadId: string,
  data: Omit<Interaction, 'id' | 'lead_id' | 'created_at'>
): Promise<Interaction> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/api/leads/${leadId}/interactions`,
    'POST',
    data
  );
  await globalMutate(`/api/leads/${leadId}`);
  return normalizeInteraction(raw);
}

export async function deleteInteraction(id: string, leadId: string): Promise<void> {
  await apiFetch(`/api/interactions/${id}`, 'DELETE');
  await globalMutate(`/api/leads/${leadId}`);
}
