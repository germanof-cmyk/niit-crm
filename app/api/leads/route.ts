import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const LeadCreateSchema = z.object({
  company: z.string().min(1),
  contact_name: z.string().min(1),
  country: z.string().min(1),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  website: z.string().optional(),
  status: z.string().min(1),
  origin: z.string().min(1),
  interest: z.string().min(1),
  responsible: z.string().optional(),
  next_action: z.string().optional(),
  next_action_date: z.string().optional(),
  technical_notes: z.string().optional(),
  order: z.number().int().default(0),
});

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: [{ status: "asc" }, { order: "asc" }],
      include: { _count: { select: { interactions: true } } },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("[GET /api/leads]", error);
    return NextResponse.json({ error: "Erro ao buscar leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { next_action_date, email, ...rest } = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        ...rest,
        email: email || undefined,
        next_action_date: next_action_date ? new Date(next_action_date) : undefined,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("[POST /api/leads]", error);
    return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 });
  }
}
