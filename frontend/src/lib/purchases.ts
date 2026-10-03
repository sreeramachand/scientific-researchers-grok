import { env } from "./env";
import { paperFileUrl } from "./paper-file";

const KEY = "sr.purchases";

export type StoredPurchase = {
  email: string;
  sku: string;
  title: string;
  accessToken: string;
};

function readAll(): StoredPurchase[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredPurchase => {
      if (!item || typeof item !== "object") return false;
      const row = item as StoredPurchase;
      return Boolean(row.email && row.sku && row.accessToken);
    });
  } catch {
    return [];
  }
}

export function purchasesForEmail(email: string): StoredPurchase[] {
  const normalized = email.trim().toLowerCase();
  return readAll().filter((item) => item.email.toLowerCase() === normalized);
}

export function purchaseFor(email: string, sku: string): StoredPurchase | undefined {
  return purchasesForEmail(email).find((item) => item.sku === sku);
}

export function savePurchase(purchase: StoredPurchase): void {
  const email = purchase.email.trim().toLowerCase();
  const next = readAll().filter((item) => !(item.email.toLowerCase() === email && item.sku === purchase.sku));
  next.push({ ...purchase, email });
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function purchasedFileUrl(sku: string, accessToken: string, download = false): string {
  return paperFileUrl(sku, accessToken, env.apiUrl, download);
}

export async function claimPurchase(input: {
  email: string;
  sku: string;
  orderToken: string;
  invoice?: string;
  title?: string;
}): Promise<StoredPurchase> {
  const response = await fetch(`${env.apiUrl.replace(/\/$/, "")}/api/entitlements/purchases/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      sku: input.sku,
      orderToken: input.orderToken,
      invoiceNumber: input.invoice ?? "",
    }),
  });
  const data = (await response.json().catch(() => ({}))) as { detail?: string; title?: string; access_token?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.detail || "This purchase could not be confirmed.");
  }
  const purchase: StoredPurchase = {
    email: input.email,
    sku: input.sku,
    title: data.title || input.title || input.sku,
    accessToken: data.access_token,
  };
  savePurchase(purchase);
  return purchase;
}
