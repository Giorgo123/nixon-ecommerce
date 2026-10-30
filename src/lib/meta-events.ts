export interface MetaEvent {
  event: string;
  payload: Record<string, unknown>;
  eventId?: string;
}

const META_EVENT_NAMES: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

interface AnalyticsItem {
  item_id?: unknown;
  item_name?: unknown;
  quantity?: unknown;
}

function readItems(params?: Record<string, unknown>): AnalyticsItem[] {
  if (!params || !Array.isArray(params.items)) return [];

  return params.items.filter(
    (item): item is AnalyticsItem => typeof item === "object" && item !== null
  );
}

export function toMetaEvent(
  name: string,
  params?: Record<string, unknown>
): MetaEvent | null {
  const event = META_EVENT_NAMES[name];
  if (!event) return null;

  const items = readItems(params);
  const payload: Record<string, unknown> = {
    content_ids: items
      .map((item) => item.item_id)
      .filter((id): id is string => typeof id === "string"),
    content_type: "product",
    num_items: items.reduce(
      (total, item) => total + (typeof item.quantity === "number" ? item.quantity : 0),
      0
    ),
  };

  const firstItemName = items.find((item) => typeof item.item_name === "string")?.item_name;
  if (typeof firstItemName === "string") {
    payload.content_name = firstItemName;
  }
  if (typeof params?.value === "number") {
    payload.value = params.value;
  }
  if (typeof params?.currency === "string") {
    payload.currency = params.currency;
  }

  const transactionId = params?.transaction_id;
  if (event === "Purchase" && typeof transactionId === "string" && transactionId) {
    return { event, payload, eventId: transactionId };
  }

  return { event, payload };
}
