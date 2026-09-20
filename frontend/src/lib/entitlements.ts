import { papers } from "../data/papers";

const KEY = "sr.entitlements";
const SUB_KEY = "sr.subscription";

export type Entitlement = {
  sku: string;
  title: string;
  purchasedAt: string;
  source: "paper" | "subscription" | "demo";
};

export type Subscription = {
  sku: string;
  name: string;
  interval: string;
  status: "active" | "canceled";
  renewsOn: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listEntitlements(): Entitlement[] {
  return readJson<Entitlement[]>(KEY, []);
}

export function getSubscription(): Subscription | null {
  return readJson<Subscription | null>(SUB_KEY, null);
}

export function hasAccess(sku: string): boolean {
  const sub = getSubscription();
  if (sub?.status === "active") return true;
  return listEntitlements().some((item) => item.sku === sku);
}

export function grantPaper(sku: string) {
  const paper = papers.find((item) => item.sku === sku);
  const entitlements = listEntitlements().filter((item) => item.sku !== sku);
  entitlements.push({
    sku,
    title: paper?.title ?? sku,
    purchasedAt: new Date().toISOString(),
    source: "paper",
  });
  window.localStorage.setItem(KEY, JSON.stringify(entitlements));
  window.dispatchEvent(new CustomEvent("sr-entitlements-changed"));
}

export function grantSubscription(input: { sku: string; name: string; interval: string }) {
  const renews = new Date();
  if (input.interval.toLowerCase().startsWith("year")) renews.setFullYear(renews.getFullYear() + 1);
  else renews.setMonth(renews.getMonth() + 1);
  const subscription: Subscription = {
    sku: input.sku,
    name: input.name,
    interval: input.interval,
    status: "active",
    renewsOn: renews.toISOString(),
  };
  window.localStorage.setItem(SUB_KEY, JSON.stringify(subscription));
  window.dispatchEvent(new CustomEvent("sr-entitlements-changed"));
}

export function cancelSubscription() {
  const current = getSubscription();
  if (!current) return;
  window.localStorage.setItem(SUB_KEY, JSON.stringify({ ...current, status: "canceled" }));
  window.dispatchEvent(new CustomEvent("sr-entitlements-changed"));
}
