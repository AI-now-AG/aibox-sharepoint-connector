// App
export const PUBLIC_ROUTES = [
  "/login",
  "/api/login",
  "/login/auth0",
  "/login/auth0/callback",
  "/logout/success",
  "/404",
  "/error",
  "/restricted",
  "/signup",
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
  "/usage",
];

// export const FEATURE_PLAINTEXT_ROUTE = "/transcription/plaintext";
// export const FEATURE_SUBTITLES_ROUTE = "/transcription/subtitles";
// export const FEATURE_SUBTITLESJSON_ROUTE = "/transcription/subtitlesjson";
// export const FEATURE_SUMMARY_ROUTE = "/transcription/summary";
// export const FEATURE_LARGEFILE_ROUTE = "/transcription/largefile";

export const FEATURE_MAP_ROUTES = {
  "audio-to-text": [
    "/transcription",
    // FEATURE_PLAINTEXT_ROUTE,
    // FEATURE_SUBTITLES_ROUTE,
    // FEATURE_SUMMARY_ROUTE,
    // FEATURE_LARGEFILE_ROUTE,
    "/settings/transcription",
  ],
};

// Auth0
export const AUTH0_SESSION_STATE = "auth0_state";
export const AUTH_AUTHORIZE_SCOPES = [
  "openid",
  "profile",
  "email",
  "ainow/roles",
];

// Usages
export const MONTHLY_USAGES = {
  IMAGE_DALLE_LIMIT_REQUEST: 10,
  IMAGE_FLUX_LIMIT_REQUEST: 20,
};

// SendGrid
export const SG_VERIFICATION_TEMPLATE = "d-69ed72334042458783f985ada5dbe61d";
export const SG_WELCOME_TEMPLATE = "d-79e6332e21d14ff792ba9d995127abb7";
