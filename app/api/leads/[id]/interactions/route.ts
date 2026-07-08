import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const InteractionCreateSchema = z.object({
  date: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  next_step: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id: lead_id } = await params;
    const body = await request.json();
    const parsed = InteractionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const interaction = await prisma.interaction.create({
      data: {
        lead_id,
        date: new Date(parsed.data.date),
        type: parsed.data.type,
        description: parsed.data.description,
        next_step: parsed.data.next_step || undefined,
      },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error("[POST /api/leads/[id]/interactions]", error);
    return NextResponse.json({ error: "Erro ao criar interação" }, { status: 500 });
  }
}
