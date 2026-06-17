import { cookies } from "next/headers";
import { adminSessionCookie } from "@/lib/auth-cookie";

export function isAdminSessionActive() {
  return cookies().get(adminSessionCookie)?.value === "active";
}
