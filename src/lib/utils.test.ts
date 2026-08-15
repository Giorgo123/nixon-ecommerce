import { describe, expect, it } from "vitest";
import { cn, parseJsonResponse, slugify } from "./utils";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Remera Oversize Dark Art")).toBe("remera-oversize-dark-art");
  });

  it("strips accents", () => {
    expect(slugify("Buzo Algodón Ñandú")).toBe("buzo-algodon-nandu");
  });

  it("collapses repeated separators and trims leading/trailing dashes", () => {
    expect(slugify("  --Taza!! Personalizada??--  ")).toBe("taza-personalizada");
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});

// Reproduce el bug real reportado en produccion: subiendo una foto desde el
// admin, Vercel cortaba el request antes de que llegara a nuestro codigo y
// devolvia "Request Entity Too Large" en texto plano. response.json() tiraba
// un SyntaxError critico en vez de mostrar el error real.
describe("parseJsonResponse", () => {
  it("parses a normal JSON body", async () => {
    const response = new Response(JSON.stringify({ url: "https://example.com/x.jpg" }));
    expect(await parseJsonResponse<{ url: string }>(response)).toEqual({
      url: "https://example.com/x.jpg",
    });
  });

  it("falls back to an error object instead of throwing when the body is plain text (el bug real)", async () => {
    const response = new Response("Request Entity Too Large", { status: 413 });
    const result = await parseJsonResponse(response);
    expect(result.error).toContain("Request Entity Too Large");
  });

  it("returns an empty object for an empty body, leaving the caller's own default message to apply", async () => {
    const response = new Response("", { status: 502 });
    const result = await parseJsonResponse(response);
    expect(result).toEqual({});
  });

  it("truncates very long non-JSON bodies instead of dumping a full HTML page into the error", async () => {
    const response = new Response("<html>".repeat(100));
    const result = await parseJsonResponse(response);
    expect(result.error?.length).toBeLessThanOrEqual(200);
  });
});
