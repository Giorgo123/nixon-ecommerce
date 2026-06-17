import { cookies } from "next/headers";
import { adminSessionCookie } from "@/lib/auth-cookie";

export async function isAdminSessionActive() {
  const cookieStore = await cookies();

  return cookieStore.get(adminSessionCookie)?.value === "active";
}