/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: import("lucia").Session;
    user: import("lucia").User;
  }
}
