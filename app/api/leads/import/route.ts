import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Lead } from '@/lib/types';

interface ImportPayload {
  leads: Partial<Lead>[];
  duplicateStrategy: 'skip' | 'update' | 'create';
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string; data: Partial<Lead> }[];
}

const REQUIRED = ['company', 'contact_name', 'country', 'status', 'origin', 'interest'] as const;

export async function POST(request: Request) {
  try {
    const body: ImportPayload = await request.json();
    const { leads, duplicateStrategy } = body;

    if (!Array.isArray(leads) || leads.length > 500) {
      return NextResponse.json({ error: 'Máximo 500 leads por chamada' }, { status: 400 });
    }

    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];

        // Validate required fields
        const missing = REQUIRED.filter(f => !lead[f]);
        if (missing.length > 0) {
          result.errors.push({
            row: i + 1,
            reason: `Campos obrigatórios faltando: ${missing.join(', ')}`,
            data: lead,
          });
          continue;
        }

        // Detect duplicate
        let existing: { id: string } | null = null;
        if (lead.email) {
          existing = await tx.lead.findFirst({ where: { email: lead.email }, select: { id: true } });
        }
        if (!existing && lead.company && lead.contact_name) {
          existing = await tx.lead.findFirst({
            where: {
              company:      { equals: lead.company,      mode: 'insensitive' },
              contact_name: { equals: lead.contact_name, mode: 'insensitive' },
            },
            select: { id: true },
          });
        }

        if (existing) {
          if (duplicateStrategy === 'skip') {
            result.skipped++;
            continue;
          }
          if (duplicateStrategy === 'update') {
            const updateData: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(lead)) {
              if (val !== undefined && val !== '' && key !== 'id') {
                updateData[key] = val;
              }
            }
            await tx.lead.update({ where: { id: existing.id }, data: updateData });
            result.updated++;
            continue;
          }
          // 'create': fall through to creation below
        }

        // Create new lead
        const agg = await tx.lead.aggregate({
          where: { status: lead.status! },
          _max: { order: true },
        });
        const order = (agg._max.order ?? 0) + 1;

        await tx.lead.create({
          data: {
            company:         lead.company!,
            contact_name:    lead.contact_name!,
            country:         lead.country!,
            status:          lead.status!,
            origin:          lead.origin!,
            interest:        lead.interest!,
            order,
            whatsapp:        lead.whatsapp  || undefined,
            email:           lead.email     || undefined,
            role:            lead.role      || undefined,
            city:            lead.city      || undefined,
            region:          lead.region    || undefined,
            website:         lead.website   || undefined,
            responsible:     lead.responsible     || undefined,
            next_action:     lead.next_action     || undefined,
            technical_notes: lead.technical_notes || undefined,
          },
        });
        result.created++;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/leads/import]', error);
    return NextResponse.json({ error: 'Erro ao importar leads' }, { status: 500 });
  }
}
