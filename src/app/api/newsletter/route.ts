import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/validations";
import { sendNewsletterSignupNotification } from "@/lib/email";
import { normalizeSubscriberEmail } from "@/lib/newsletter";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

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

    const normalizedEmail = normalizeSubscriberEmail(email);

    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email: normalizedEmail },
        create: { email: normalizedEmail, source: "web" },
        update: {},
      });
    } catch (error) {
      console.error("Error guardando suscriptor del newsletter:", error);
      return NextResponse.json(
        { error: "No se pudo registrar el email. Probá de nuevo." },
        { status: 500 }
      );
    }

    await sendNewsletterSignupNotification(normalizedEmail);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el email" }, { status: 500 });
  }
}
