import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ReorderSchema = z.array(
  z.object({
    id: z.string(),
    status: z.string(),
    order: z.number().int(),
  })
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.$transaction(
      parsed.data.map(({ id, status, order }) =>
        prisma.lead.update({
          where: { id },
          data: { status, order, updated_at: new Date() },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/leads/reorder]", error);
    return NextResponse.json({ error: "Erro ao reordenar leads" }, { status: 500 });
  }
}
