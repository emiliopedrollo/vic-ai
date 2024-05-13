/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_COWMED_AUTH_URL: string
  readonly VITE_COWMED_API_URL: string
  readonly VITE_COWMED_OAUTH_CLIENT_ID: string
  readonly VITE_COWMED_OAUTH_CLIENT_SECRET: string
  readonly VITE_BACKEND_HOST: string
  readonly VITE_WEBSOCKET_HOST: string
  readonly VITE_OPENAI_ORGANIZATION: string
  readonly VITE_OPENAI_API_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
