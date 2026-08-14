import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/validations";
import { sendNewsletterSignupNotification } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(`newsletter:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const { email } = (await request.json()) as { email?: string };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Ingresá un email válido" }, { status: 400 });
    }

    await sendNewsletterSignupNotification(email);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el email" }, { status: 500 });
  }
}
