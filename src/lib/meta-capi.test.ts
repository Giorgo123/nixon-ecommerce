import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildMetaPurchasePayload,
  hashMetaField,
  normalizePhone,
  sendMetaPurchaseEvent,
  type MetaPurchaseInput,
} from "./meta-capi";

const input: MetaPurchaseInput = {
  orderId: "order-1",
  value: 16000,
  currency: "ARS",
  email: "  Buyer@Example.COM ",
  phone: "+54 9 11 1234-5678",
  fullName: "Ana Maria Perez",
  city: "Cordoba",
  state: "Cordoba",
  zipCode: "X5000",
  items: [
    { id: "variant-1", quantity: 2, price: 4500 },
    { id: "variant-2", quantity: 1, price: 7000 },
  ],
  eventSourceUrl: "https://nixonstudio.com.ar/success",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("hashMetaField", () => {
  it("hashea de forma determinista, sin espacios y en minúsculas", () => {
    expect(hashMetaField("  Buyer@Example.COM ")).toBe(
      "6a6c26195c3682faa816966af789717c3bfa834eee6c599d667d2b3429c27cfd"
    );
    expect(hashMetaField("buyer@example.com")).toBe(hashMetaField("  Buyer@Example.COM "));
  });
});

describe("normalizePhone", () => {
  it("deja sólo los dígitos", () => {
    expect(normalizePhone("+54 9 11 1234-5678")).toBe("5491112345678");
  });
});

describe("buildMetaPurchasePayload", () => {
  it("hashea user_data y arma custom_data con el event_id de la orden", () => {
    const now = new Date("2026-10-30T12:00:00.000Z");
    const payload = buildMetaPurchasePayload(input, now);

    expect(payload).toMatchObject({
      event_name: "Purchase",
      event_time: Math.floor(now.getTime() / 1000),
      event_id: "order-1",
      action_source: "website",
      event_source_url: "https://nixonstudio.com.ar/success",
      user_data: {
        em: [hashMetaField("buyer@example.com")],
        ph: [hashMetaField("5491112345678")],
        fn: [hashMetaField("ana")],
        ln: [hashMetaField("maria perez")],
        ct: [hashMetaField("cordoba")],
        st: [hashMetaField("cordoba")],
        zp: [hashMetaField("x5000")],
        country: [hashMetaField("ar")],
      },
      custom_data: {
        currency: "ARS",
        value: 16000,
        content_ids: ["variant-1", "variant-2"],
        content_type: "product",
        num_items: 3,
        order_id: "order-1",
      },
    });
  });
});

describe("sendMetaPurchaseEvent", () => {
  it("hace no-op si faltan las credenciales de CAPI", async () => {
    vi.stubEnv("META_PIXEL_ID", "");
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(sendMetaPurchaseEvent(input)).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
