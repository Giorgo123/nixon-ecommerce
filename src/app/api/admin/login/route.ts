import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { adminSessionCookie } from "@/lib/auth-cookie";
import { isValidEmail } from "@/lib/validations";
import { createSessionToken } from "@/lib/session-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Valid bcrypt hash of an unrelated random string — used to keep the
// compare cost constant when no admin matches the email, so failed
// logins don't leak (via timing) whether the email exists.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8G8SkzwepDCyHVEHtF9nsD7DiOFj0RC";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (!checkRateLimit(`admin-login:${ip}`)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!isValidEmail(email) || typeof password !== "string") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    const isValidPassword = await bcrypt.compare(password, admin?.password ?? DUMMY_HASH);

    if (!admin || !isValidPassword) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminSessionCookie, await createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }
}
