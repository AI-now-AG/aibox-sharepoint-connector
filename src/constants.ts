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
  "/billing/usage",
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

export const FEATURE_MAP_ROUTES = {
  "audio-to-text": ["/transcription", "/settings/transcription"],
};

// Auth0
export const AUTH0_SESSION_STATE = "auth0_state";
export const AUTH_AUTHORIZE_SCOPES = [
  "openid",
  "profile",
  "email",
  "ainow/roles",
];
export const AUTH0_ROLE_ADMIN_DEV = "rol_gkr3eCUL4jGIFgVu";
export const AUTH0_ROLE_ADMIN_PROD = "rol_ekmcY6vrW5QiG5NF";
export const AUTH0_AUTH_GOOGLE_CON_DEV = "con_kW37LrJ1vOiVrqMO";
export const AUTH0_AUTH_WINDOWS_CON_DEV = "con_RcwIKnfC9eq1QjFm";
export const AUTH0_AUTH_GOOGLE_CON_PROD = "con_jB6o4Tj6BeetKBc5";
export const AUTH0_AUTH_WINDOWS_CON_PROD = "con_Si1JPT62XNjp9gVp";

// SendGrid
export const SG_VERIFICATION_TEMPLATE = "d-69ed72334042458783f985ada5dbe61d";
export const SG_WELCOME_TEMPLATE = "d-79e6332e21d14ff792ba9d995127abb7";
export const SG_NEW_TENANT_TEMPLATE = "d-87847bafc967448e93d99a411edece3a";

// Tenants
export const TENANT_MASTER_DEV = "67ff572260fa2a8bca5d26d0"; // aibox dev master
export const TENANT_MASTER_PROD = "66cc50d98103241cf3354d3f"; // aibox master
