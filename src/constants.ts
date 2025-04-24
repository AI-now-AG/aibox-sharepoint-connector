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

// SendGrid
export const SG_VERIFICATION_TEMPLATE = "d-69ed72334042458783f985ada5dbe61d";
export const SG_WELCOME_TEMPLATE = "d-79e6332e21d14ff792ba9d995127abb7";
export const SG_NEW_TENANT_TEMPLATE = "d-87847bafc967448e93d99a411edece3a";

// Tenants
export const TENANT_MASTER_DEV = "67ff572260fa2a8bca5d26d0"; // aibox dev master
export const TENANT_MASTER_PROD = "67c869198b14a3bbaa6ba611"; // aibox Trial

export const SUBSCIPTION_STEP = {
  Step0: 0,
  Step1: 1,
  Step2: 2,
  Step3: 3,
  Step4: 4,
  Completed: 5,
};
