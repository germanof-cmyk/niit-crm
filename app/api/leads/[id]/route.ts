import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const LeadUpdateSchema = z.object({
  company: z.string().min(1).optional(),
  contact_name: z.string().min(1).optional(),
  country: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  website: z.string().optional(),
  status: z.string().optional(),
  origin: z.string().optional(),
  interest: z.string().optional(),
  responsible: z.string().optional(),
  next_action: z.string().optional(),
  next_action_date: z.string().optional().nullable(),
  technical_notes: z.string().optional(),
  order: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        interactions: { orderBy: { date: "desc" } },
      },
    });
    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    console.error("[GET /api/leads/[id]]", error);
    return NextResponse.json({ error: "Erro ao buscar lead" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = LeadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { next_action_date, email, ...rest } = parsed.data;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...rest,
        email: email || undefined,
        next_action_date:
          next_action_date === null
            ? null
            : next_action_date
            ? new Date(next_action_date)
            : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    console.error("[PUT /api/leads/[id]]", error);
    return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.lead.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    console.error("[DELETE /api/leads/[id]]", error);
    return NextResponse.json({ error: "Erro ao excluir lead" }, { status: 500 });
  }
}
