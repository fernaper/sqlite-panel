/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ADMIN_USER: string;
  readonly ADMIN_PASSWORD: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}