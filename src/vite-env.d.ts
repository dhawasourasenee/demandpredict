/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional API origin (no trailing slash). Empty = same origin + dev proxy. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
