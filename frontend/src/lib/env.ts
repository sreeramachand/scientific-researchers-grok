export function publicEnv(name: string, fallback = ""): string {
  const value = (import.meta.env[name] as string | undefined) ?? fallback;
  return value.trim();
}

export const env = {
  web3formsKey: publicEnv("PUBLIC_WEB3FORMS_ACCESS_KEY"),
  snipcartKey: publicEnv("PUBLIC_SNIPCART_API_KEY"),
  buyMeACoffeeUrl: publicEnv(
    "PUBLIC_BUYMEACOFFEE_URL",
    "https://www.buymeacoffee.com/scientificresearchers",
  ),
  neonAuthUrl: publicEnv("PUBLIC_NEON_AUTH_URL"),
  apiUrl: publicEnv("PUBLIC_API_URL", "http://127.0.0.1:8007"),
};

export const hasNeonAuth = Boolean(env.neonAuthUrl);
export const hasSnipcart = Boolean(env.snipcartKey);
export const hasWeb3Forms = Boolean(env.web3formsKey);
