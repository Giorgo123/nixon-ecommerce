import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./csp";

const productionPolicy = buildContentSecurityPolicy(false);
const developmentPolicy = buildContentSecurityPolicy(true);

describe("buildContentSecurityPolicy", () => {
  it("autoriza medios desde el mismo origen, blobs locales y Vercel Blob", () => {
    expect(productionPolicy).toContain(
      "media-src 'self' blob: https://*.public.blob.vercel-storage.com;"
    );
    expect(developmentPolicy).toContain(
      "media-src 'self' blob: https://*.public.blob.vercel-storage.com;"
    );
  });

  it("incluye 'wasm-unsafe-eval' en script-src en producción y en desarrollo", () => {
    expect(productionPolicy).toContain("'wasm-unsafe-eval'");
    expect(developmentPolicy).toContain("'wasm-unsafe-eval'");
  });

  it("solo permite 'unsafe-eval' en desarrollo", () => {
    expect(productionPolicy).not.toContain("'unsafe-eval'");
    expect(developmentPolicy).toContain("'unsafe-eval'");
  });

  it("autoriza los orígenes de Meta Pixel y Conversions API", () => {
    for (const policy of [productionPolicy, developmentPolicy]) {
      const directives = policy.split("; ");
      const scriptSrc = directives.find((directive) => directive.startsWith("script-src ")) ?? "";
      const connectSrc = directives.find((directive) => directive.startsWith("connect-src ")) ?? "";
      const imgSrc = directives.find((directive) => directive.startsWith("img-src ")) ?? "";

      expect(scriptSrc).toContain("https://connect.facebook.net");
      expect(connectSrc).toContain("https://www.facebook.com");
      expect(connectSrc).toContain("https://connect.facebook.net");
      expect(imgSrc).toContain("https://www.facebook.com");
    }
  });

  it("mantiene intactas las directivas de seguridad existentes", () => {
    for (const policy of [productionPolicy, developmentPolicy]) {
      expect(policy).toContain("default-src 'self';");
      expect(policy).toContain("object-src 'none';");
      expect(policy).toContain("frame-ancestors 'none';");
      expect(policy).toContain("base-uri 'self';");
      expect(policy).toContain("font-src 'self' data:;");
      expect(policy).toContain("style-src 'self' 'unsafe-inline';");
      expect(policy).toContain("https://www.googletagmanager.com;");
    }
  });

  it("devuelve una sola línea normalizada terminada en punto y coma", () => {
    for (const policy of [productionPolicy, developmentPolicy]) {
      expect(policy).not.toMatch(/[\r\n]/);
      expect(policy).not.toMatch(/\s{2,}/);
      expect(policy.endsWith(";")).toBe(true);
    }
  });
});
