import { describe, expect, it } from "vitest";
import { buildSubscribersCsv, normalizeSubscriberEmail } from "./newsletter";

describe("normalizeSubscriberEmail", () => {
  it("quita espacios y pasa a minúsculas", () => {
    expect(normalizeSubscriberEmail("  Foo.Bar+News@Example.COM ")).toBe(
      "foo.bar+news@example.com"
    );
  });
});

describe("buildSubscribersCsv", () => {
  it("devuelve sólo el encabezado cuando no hay suscriptores", () => {
    expect(buildSubscribersCsv([])).toBe("email,fecha_alta");
  });

  it("escribe una fila por suscriptor separada por CRLF", () => {
    const csv = buildSubscribersCsv([
      { email: "a@example.com", createdAt: new Date("2026-01-02T03:04:05.000Z") },
      { email: "b@example.com", createdAt: "2026-02-03T04:05:06.000Z" },
    ]);

    expect(csv).toBe(
      [
        "email,fecha_alta",
        "a@example.com,2026-01-02T03:04:05.000Z",
        "b@example.com,2026-02-03T04:05:06.000Z",
      ].join("\r\n")
    );
  });

  it("escapa comas y comillas envolviendo el campo y duplicando las comillas", () => {
    const csv = buildSubscribersCsv([
      { email: 'a,b"c@example.com', createdAt: "2026-01-01T00:00:00.000Z" },
    ]);

    expect(csv).toContain('"a,b""c@example.com",2026-01-01T00:00:00.000Z');
  });
});
