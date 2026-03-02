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
  "/reports/*",
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
  "/settings/prompt-refinement",
  "/settings/prompt-refinement/*",
  "/settings/rag-configuration",
  "/settings/rag-configuration/*",
  "/admin",
  "/admin/*",
  "/admin/global-prompt-library/tags",
  "/admin/global-prompt-library/categories",
  "/admin/global-prompt-library/prompts",
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
export const SG_PASSWORD_RESET_TEMPLATE = "d-6eee3ae854944c4ebd17e1d7264975d5";
export const SG_SOMEDIA_PASSWORD_TEMPLATE =
  "d-bd2d9c5a0f3d46408eeafc00c632c271";
export const SG_NEW_TENANT_TEMPLATE = "d-87847bafc967448e93d99a411edece3a";

// Tenants
export const TENANT_MASTER_ID = {
  DEV: "67ff572260fa2a8bca5d26d0", // aibox dev master
  PROD: "66cc50d98103241cf3354d3f", // aibox master
};
export const TENANT_SOMEDIA_ID = {
  DEV: "671f3f4c44d9f6336b4cdd6a", // Somedia TEST
  PROD: "66aa21a3d40d0b194e280143", // Somedia
};
export const TENANT_SOMEDIA_NAME = {
  DEV: "somedia-dev", // somedia-dev
  PROD: "somedia", // somedia
};

// Stripe
export const STRIPE_PRODUCTS = {
  DEV: {
    Starter: "price_1SDLbSBIpWAJAQFJROPWUvM3",
    Teams: "price_1SxnbeBIpWAJAQFJXdbaFiAe",
    Pro: "price_1SxncJBIpWAJAQFJNnUy4MYh",
    AudioBasis: "price_1SDLj7BIpWAJAQFJVWvkacQr", // Basis + Large merged into AudioToText
    AudioBasisAddOnLarge: "price_1SDLmiBIpWAJAQFJB2Bx17di", // Basis + Large merged into AudioToText
    AudioBasisAddOnSubtitle: "price_1SDLpGBIpWAJAQFJT04nekfl",
    AudioToText: "price_1SxmtABIpWAJAQFJqfDt7TlV",
    AudioToText_Starter: "price_1SxmtABIpWAJAQFJqfDt7TlV", // 29 CHF
    AudioToText_Teams: "price_1SypxcBIpWAJAQFJtnoLAwqG", // 79 CHF
    AudioToText_Pro: "price_1SypyDBIpWAJAQFJBDlIPzK6", // 119 CHF
    AudioPremium: "price_1SxnsZBIpWAJAQFJyk1xgYvE",
  },
  PROD: {
    Starter: "price_1SDLtnBTLa4XuBC9pwut7szi",
    Teams: "price_1SxndQBTLa4XuBC93GkZ0nXr",
    Pro: "price_1Sxnd1BTLa4XuBC9bwLQBHEX",
    AudioBasis: "price_1SDLt7BTLa4XuBC9lP214stV", // Basis + Large merged into AudioToText
    AudioBasisAddOnLarge: "price_1SDLukBTLa4XuBC9xBgIpfaG", // Basis + Large merged into AudioToText
    AudioBasisAddOnSubtitle: "price_1SDLwMBTLa4XuBC9j3KYiEav",
    AudioToText: "price_1SxmuJBTLa4XuBC9kCvTIX2L",
    AudioToText_Starter: "price_1SxmuJBTLa4XuBC9kCvTIX2L", // 29 CHF
    AudioToText_Teams: "price_1SyvkuBTLa4XuBC99S9VlJY6", // 79 CHF
    AudioToText_Pro: "price_1SyvlHBTLa4XuBC9bjC4KA2f", // 119 CHF
    AudioPremium: "price_1SxntCBTLa4XuBC9PtxNsCkB",
  },
};

export const STRIPE_TAX_RATE = {
  DEV: "txr_1RPNDiBIpWAJAQFJ9jD4Jlpj",
  PROD: "txr_1RQOYKBTLa4XuBC9iZoAKkz1",
};
