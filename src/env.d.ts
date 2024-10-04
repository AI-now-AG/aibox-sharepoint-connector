/* eslint @typescript-eslint/triple-slash-reference: "off" */

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: import("lucia").Session; // lucia
    user: import("lucia").User; // lucia
    tenant: import("$data/models/tenant.model").Tenant; // custom
  }
}
