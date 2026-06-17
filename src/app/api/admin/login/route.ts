import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie } from "@/lib/auth-cookie";
import { isValidEmail } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@nixonstudio.com";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

    if (!isValidEmail(email) || typeof password !== "string") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminSessionCookie, "active", {
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
