import { readAuthToken } from "./auth";
import { env } from "./env";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = readAuthToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const base = env.apiUrl.replace(/\/$/, "");
  return fetch(`${base}${path}`, { ...init, headers });
}
