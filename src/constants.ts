// App
export const PUBLIC_ROUTES = [
  "/login",
  "/login/*",
  "/logout/*",
  "/404",
  "/error",
  "/restricted",
  "/signup",
  "/api/users/block-user.json",
  "/api/users/check-trial.json",
];

export const SUPER_USER_ROUTES = [
  "/prompt-library/prompts",
  "/prompt-library/prompts/*",
  "/prompt-library/knowledge-base",
  "/prompt-library/knowledge-base/*",
  "/prompt-library/categories",
  "/prompt-library/categories/*",
  "/settings/transcription",
  "/settings/transcription/*",
];

export const ADMIN_ROUTES = [
  "/user-management",
  "/user-management/*",
  "/settings/subscription",
  "/settings/subscription/*",
  "/billing/usage",
  "/billing/usage/*",
];

export const SUPER_ADMIN_ROUTES = [
  "/tenant-management",
  "/tenant-management/*",
  "/api/prompts/export",
  "/api/prompts/import",
  "/secure",
  "/secure/*",
  "/reports",
  "/reports/*",
  "/settings/instruction",
  "/settings/instruction/*",
  "settings/prompt-refinement",
  "settings/prompt-refinement/*",
];

export const FEATURE_MAP_ROUTES = {
  "audio-to-text": ["/transcription", "/settings/transcription"],
};

export const SKIP_CHEKING_ONBOARDING_ROUTES = [
  "/subscription",
  "/subscription/*",
  "/logout",
  "/logout/*",
  "/api/logout",
  "/_actions/*",
];

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
export const SG_PASSWORD_RESET_TEMPLATE = "d-69ed72334042458783f985ada5dbe61d";
export const SG_NEW_TENANT_TEMPLATE = "d-87847bafc967448e93d99a411edece3a";

// Tenants
export const TENANT_MASTER_DEV = "67ff572260fa2a8bca5d26d0"; // aibox dev master
export const TENANT_MASTER_PROD = "66cc50d98103241cf3354d3f"; // aibox master

// Stripe
export const STRIPE_PRODUCTS_DEV = {
  Starter: "price_1SDLbSBIpWAJAQFJROPWUvM3",
  Teams: "price_1RLNJgBIpWAJAQFJ6PJgPAvD",
  Pro: "price_1RPIXIBIpWAJAQFJjLdCnZdy",
  AudioBasis: "price_1SDLj7BIpWAJAQFJVWvkacQr",
  AudioBasisAddOnLarge: "price_1SDLmiBIpWAJAQFJB2Bx17di",
  AudioBasisAddOnSubtitle: "price_1SDLpGBIpWAJAQFJT04nekfl",
  AudioPremium: "price_1SDLqEBIpWAJAQFJBWBsQiEn",
};
export const STRIPE_PRODUCTS_PROD = {
  Starter: "price_1SDLtnBTLa4XuBC9pwut7szi",
  Teams: "price_1RQOSuBTLa4XuBC9nmmXyldF",
  Pro: "price_1RQOSsBTLa4XuBC9QgPti4FX",
  AudioBasis: "price_1SDLj7BIpWAJAQFJVWvkacQr",
  AudioBasisAddOnLarge: "price_1SDLukBTLa4XuBC9xBgIpfaG",
  AudioBasisAddOnSubtitle: "price_1SDLwMBTLa4XuBC9j3KYiEav",
  AudioPremium: "price_1SDLwqBTLa4XuBC9Bbg6FFCr",
};
export const STRIPE_TAX_RATE_DEV = "txr_1RPNDiBIpWAJAQFJ9jD4Jlpj";
export const STRIPE_TAX_RATE_PROD = "txr_1RQOYKBTLa4XuBC9iZoAKkz1";
