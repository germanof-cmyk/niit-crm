'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lead, Interaction } from './types';
import { getLeads, saveLeads, getInteractions, saveInteractions, generateId } from './storage';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    setLeads(getLeads());
  }, []);

  const createLead = useCallback((data: Omit<Lead, 'id' | 'order' | 'created_at' | 'updated_at'>) => {
    const allLeads = getLeads();
    const sameStatus = allLeads.filter(l => l.status === data.status);
    const newLead: Lead = {
      ...data,
      id: generateId(),
      order: sameStatus.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...allLeads, newLead];
    saveLeads(updated);
    setLeads(updated);
    return newLead;
  }, []);

  const updateLead = useCallback((id: string, data: Partial<Lead>) => {
    const allLeads = getLeads();
    const updated = allLeads.map(l =>
      l.id === id ? { ...l, ...data, updated_at: new Date().toISOString() } : l
    );
    saveLeads(updated);
    setLeads(updated);
  }, []);

  const deleteLead = useCallback((id: string) => {
    const allLeads = getLeads();
    const updated = allLeads.filter(l => l.id !== id);
    saveLeads(updated);
    setLeads(updated);
  }, []);

  const updateLeadsOrder = useCallback((updatedLeads: Lead[]) => {
    const allLeads = getLeads();
    const updatedMap = new Map(updatedLeads.map(l => [l.id, l]));
    const merged = allLeads.map(l => updatedMap.get(l.id) || l);
    saveLeads(merged);
    setLeads(merged);
  }, []);

  return { leads, createLead, updateLead, deleteLead, updateLeadsOrder };
}

export function useInteractions(leadId?: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    const all = getInteractions();
    setInteractions(leadId ? all.filter(i => i.lead_id === leadId) : all);
  }, [leadId]);

  const createInteraction = useCallback((data: Omit<Interaction, 'id' | 'created_at'>) => {
    const all = getInteractions();
    const newItem: Interaction = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    const updated = [...all, newItem];
    saveInteractions(updated);
    setInteractions(leadId ? updated.filter(i => i.lead_id === leadId) : updated);
    return newItem;
  }, [leadId]);

  const deleteInteraction = useCallback((id: string) => {
    const all = getInteractions();
    const updated = all.filter(i => i.id !== id);
    saveInteractions(updated);
    setInteractions(leadId ? updated.filter(i => i.lead_id === leadId) : updated);
  }, [leadId]);

  return { interactions, createInteraction, deleteInteraction };
}
