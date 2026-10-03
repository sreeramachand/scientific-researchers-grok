/** Browser helpers for a purchased PDF. The full file is not a public path. */

export function paperFilePath(sku: string, accessToken: string, download = false): string {
  const path = `/api/entitlements/papers/${encodeURIComponent(sku)}/file/?access=${encodeURIComponent(accessToken)}`;
  return download ? `${path}&download=1` : path;
}

export function paperFileUrl(sku: string, accessToken: string, apiBase: string, download = false): string {
  const base = apiBase.replace(/\/$/, "");
  return `${base}${paperFilePath(sku, accessToken, download)}`;
}

export function orderTokenFrom(payload: unknown): string {
  const records: unknown[] = [payload];
  if (payload && typeof payload === "object") {
    const record = payload as { order?: unknown; cart?: unknown; content?: unknown };
    records.push(record.content, record.order, record.cart);
  }
  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    const token = (record as { token?: unknown }).token;
    if (typeof token === "string" && token.trim().length >= 8) return token.trim();
  }
  return "";
}

export function invoiceFrom(payload: unknown): string {
  const records: unknown[] = [payload];
  if (payload && typeof payload === "object") {
    const record = payload as { order?: unknown; content?: unknown };
    records.push(record.content, record.order);
  }
  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    const invoice = (record as { invoiceNumber?: unknown }).invoiceNumber;
    if (typeof invoice === "string" && invoice.trim()) return invoice.trim();
  }
  return "";
}

export function paperSkusInOrder(payload: unknown, known: Set<string>): string[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as { items?: unknown; cart?: { items?: unknown }; content?: { items?: unknown } };
  const items = Array.isArray(record.items)
    ? record.items
    : Array.isArray(record.content?.items)
      ? record.content.items
      : Array.isArray(record.cart?.items)
        ? record.cart.items
        : [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const row = item as { id?: unknown; productId?: unknown };
      return String(row.id ?? row.productId ?? "");
    })
    .filter((id) => known.has(id));
}
