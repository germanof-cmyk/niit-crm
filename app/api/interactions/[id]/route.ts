import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.interaction.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Interação não encontrada" }, { status: 404 });
    }
    console.error("[DELETE /api/interactions/[id]]", error);
    return NextResponse.json({ error: "Erro ao excluir interação" }, { status: 500 });
  }
}
