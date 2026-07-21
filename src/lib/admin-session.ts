import { cookies } from "next/headers";
import { adminSessionCookie } from "@/lib/auth-cookie";
import { verifySessionToken } from "@/lib/session-token";

export async function isAdminSessionActive() {
  const cookieStore = await cookies();

  return verifySessionToken(cookieStore.get(adminSessionCookie)?.value);
}
