import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-session";
import { buildSubscribersCsv } from "@/lib/newsletter";
import prisma from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: { email: true, createdAt: true },
    });

    return new Response(buildSubscribersCsv(subscribers), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="suscriptores.csv"',
      },
    });
  } catch (error) {
    console.error("Error exportando suscriptores del newsletter:", error);
    return NextResponse.json({ error: "No se pudieron exportar los suscriptores" }, { status: 500 });
  }
}
