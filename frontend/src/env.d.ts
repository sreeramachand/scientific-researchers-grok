/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_WEB3FORMS_ACCESS_KEY?: string;
  readonly PUBLIC_SNIPCART_API_KEY?: string;
  readonly PUBLIC_BUYMEACOFFEE_URL?: string;
  readonly PUBLIC_NEON_AUTH_URL?: string;
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
