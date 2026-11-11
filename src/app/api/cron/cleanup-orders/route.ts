import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredPendingOrders } from "@/lib/order";

export const dynamic = "force-dynamic";

// Comparación timing-safe del header completo. `timingSafeEqual` exige
// buffers del mismo largo, por eso la longitud se compara aparte: un token
// de otro largo no puede coincidir y no filtra por cuántos bytes difirió.
function isAuthorized(request: NextRequest, secret: string) {
  const header = request.headers.get("authorization");
  if (!header) return false;

  const received = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // Fail-closed: sin secreto configurado no se barre nada. Un deploy sin la
  // variable no debe exponer el mantenimiento a cualquiera.
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 500 }
    );
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const released = await releaseExpiredPendingOrders();
    return NextResponse.json({ ok: true, released });
  } catch {
    // No se expone el stack ni el mensaje interno; los logs del runtime
    // conservan el detalle.
    return NextResponse.json({ error: "Error al limpiar órdenes" }, { status: 500 });
  }
}
