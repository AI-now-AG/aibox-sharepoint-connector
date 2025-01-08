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

export const ADMIN_ROUTES = [
  "/user-management",
  "/user-management/*",
  "/prompt-library/prompts",
  "/prompt-library/prompts/*",
  "/prompt-library/knowledge-base",
  "/prompt-library/knowledge-base/*",
  "/prompt-library/categories",
  "/prompt-library/categories/*",
  "/settings/transcription",
  "/settings/transcription/*",
];

export const SUPER_ADMIN_ROUTES = [
  "/tenant-management",
  "/tenant-management/*",
  "/api/prompts/export",
  "/api/prompts/import",
  "/secure",
  "/secure/*",
];

export const FEATURE_PLAINTEXT_ROUTE = "/transcription/plaintext";
export const FEATURE_SUBTITLES_ROUTE = "/transcription/subtitles";
export const FEATURE_SUMMARY_ROUTE = "/transcription/summary";
export const FEATURE_LARGEFILE_ROUTE = "/transcription/largefile";

export const FEATURE_MAP_ROUTES = {
  "audio-to-text": [
    "/transcription",
    FEATURE_PLAINTEXT_ROUTE,
    FEATURE_SUBTITLES_ROUTE,
    FEATURE_SUMMARY_ROUTE,
    FEATURE_LARGEFILE_ROUTE,
    "/settings/transcription",
  ],
};
