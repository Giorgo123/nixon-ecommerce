export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

// Vercel (u otro proxy intermedio) puede devolver un error de plataforma en
// texto plano ANTES de que el request llegue a nuestro route handler (413
// por body muy grande, 504 por timeout, etc.) - un response.json() directo
// tira un SyntaxError críptico ("Unexpected token... is not valid JSON") en
// vez de mostrar el error real. Esto paso de verdad en el admin subiendo
// una foto. Cualquier fetch a una API propia que espera JSON debería usar
// esto en vez de response.json() directo.
export async function parseJsonResponse<T = { error?: string }>(response: Response): Promise<T> {
  const raw = await response.text();
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return { error: raw.slice(0, 200) || `Error del servidor (${response.status})` } as T;
  }
}

// Fisher-Yates - no muta el array de entrada.
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
