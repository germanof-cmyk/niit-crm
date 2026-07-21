import Papa from 'papaparse';
import { Lead } from './types';

export function exportLeadsToCsv(leads: Lead[]): void {
  const rows = leads.map(l => ({
    'Empresa': l.company,
    'Nome do contato': l.contact_name,
    'Cargo': l.role ?? '',
    'E-mail': l.email ?? '',
    'WhatsApp': l.whatsapp ?? '',
    'País': l.country,
    'Cidade': l.city ?? '',
    'Estado': l.region ?? '',
    'Site': l.website ?? '',
    'Status': l.status,
    'Origem': l.origin,
    'Interesse': l.interest,
    'Responsável': l.responsible ?? '',
    'Próxima ação': l.next_action ?? '',
    'Data próxima ação': l.next_action_date ?? '',
    'Observações': l.technical_notes ?? '',
    'Criado em': l.created_at.slice(0, 10),
  }));

  const csv = Papa.unparse(rows, { quotes: true });
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `niit-leads-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
