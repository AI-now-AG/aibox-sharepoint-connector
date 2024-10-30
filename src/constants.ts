export const PUBLIC_ROUTES = [
  "/login",
  "/api/login",
  "/login/auth0",
  "/login/auth0/callback",
  "/logout/success",
  "/404",
  "/error",
  "/restricted",
];

export const SUPER_ADMIN_ROUTES = [
  "/tenant-management",
  "/tenant-management/*",
  "/secure",
  "/secure/*",
];

export const FEATURE_MAP_ROUTES = {
  "audio-to-text": ["/transcription", "/settings/transcription"],
};

export enum TenantFeature {
  AudioToText = "audio-to-text",
  TextPrompt = "text-prompt",
}

export enum ApiKeyProvider {
  OpenAI = "openai",
  AzureOpenAI = "azure_openai",
}