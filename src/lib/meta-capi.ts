import { createHash } from "crypto";

export interface MetaPurchaseItem {
  id: string;
  quantity: number;
  price: number;
}

export interface MetaPurchaseInput {
  orderId: string;
  value: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  items: MetaPurchaseItem[];
  eventSourceUrl: string;
}

export interface MetaPurchasePayload {
  event_name: "Purchase";
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url: string;
  user_data: Record<string, string[]>;
  custom_data: {
    currency: string;
    value: number;
    content_ids: string[];
    content_type: "product";
    num_items: number;
    order_id: string;
  };
}

export interface MetaOrderForPurchase {
  id: string;
  totalPrice: number;
  email: string;
  phone: string;
  fullName: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  items: Array<{ quantity: number; price: number; variant: { id: string } }>;
}

export function hashMetaField(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildMetaPurchasePayload(
  input: MetaPurchaseInput,
  now = new Date()
): MetaPurchasePayload {
  const userData: Record<string, string[]> = {
    country: [hashMetaField("ar")],
  };

  if (input.email?.trim()) {
    userData.em = [hashMetaField(input.email)];
  }

  const normalizedPhone = input.phone ? normalizePhone(input.phone) : "";
  if (normalizedPhone) {
    userData.ph = [hashMetaField(normalizedPhone)];
  }

  const nameParts = (input.fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (nameParts.length > 0) {
    userData.fn = [hashMetaField(nameParts[0])];
  }
  if (nameParts.length > 1) {
    userData.ln = [hashMetaField(nameParts.slice(1).join(" "))];
  }

  if (input.city?.trim()) {
    userData.ct = [hashMetaField(input.city)];
  }
  if (input.state?.trim()) {
    userData.st = [hashMetaField(input.state)];
  }
  if (input.zipCode?.trim()) {
    userData.zp = [hashMetaField(input.zipCode)];
  }

  return {
    event_name: "Purchase",
    event_time: Math.floor(now.getTime() / 1000),
    event_id: input.orderId,
    action_source: "website",
    event_source_url: input.eventSourceUrl,
    user_data: userData,
    custom_data: {
      currency: input.currency,
      value: input.value,
      content_ids: input.items.map((item) => item.id),
      content_type: "product",
      num_items: input.items.reduce((total, item) => total + item.quantity, 0),
      order_id: input.orderId,
    },
  };
}

export function metaPurchaseInputFromOrder(
  order: MetaOrderForPurchase,
  eventSourceUrl: string
): MetaPurchaseInput {
  return {
    orderId: order.id,
    value: order.totalPrice,
    currency: "ARS",
    email: order.email,
    phone: order.phone,
    fullName: order.fullName,
    city: order.city,
    state: order.state,
    zipCode: order.zipCode,
    items: order.items.map((item) => ({
      id: item.variant.id,
      quantity: item.quantity,
      price: item.price,
    })),
    eventSourceUrl,
  };
}

export async function sendMetaPurchaseEvent(input: MetaPurchaseInput): Promise<boolean> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return false;

  const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0";
  const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [buildMetaPurchasePayload(input)] }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[meta-capi] Error ${response.status}: ${text}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[meta-capi] No se pudo enviar el Purchase:", error);
    return false;
  }
}
