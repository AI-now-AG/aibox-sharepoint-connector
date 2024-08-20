/* empty css                                 */
import { c as createComponent, r as renderTemplate, d as renderComponent, b as createAstro, m as maybeRenderHead, a as addAttribute, f as renderTransition } from '../chunks/astro/server_BvvS3v0v.mjs';
import { f as avatar, $ as $$Layout } from '../chunks/Layout_i1A0xYMe.mjs';
import { u as useTranslations } from '../chunks/Head_BGho-qey.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const t = useTranslations(Astro2.preferredLocale);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "isFooterVisible": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="p-4 flex-1 flex-col w-100 h-100 mt-8 text-center space-y-16"> <h1 class="text-3xl font-extrabold mt-9 mb-4">${t("welcome.title")}</h1> <p class="text-lg">${t("welcome.text")}</p> <div class="row space-x-4"> <button class="btn btn-outline text-primary"> ${t("welcome.get-started")} <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor"> <polygon points="7.293 4.707 14.586 12 7.293 19.293 8.707 20.707 17.414 12 8.707 3.293 7.293 4.707"></polygon> </svg> </button> <button class="btn btn-outline text-neutral"> ${t("welcome.explore")} </button> </div> <div class="container lg:px-4 mx-auto"> <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center"${addAttribute(renderTransition($$result2, "iiwdael6"), "data-astro-transition-scope")}> <div class="card w-full bg-base-300 shadow-lg"> <div class="card-body items-center text-center"> <img alt="Avatar Image"${addAttribute(avatar.src, "src")}> <h2 class="card-title">Newsletter generation</h2> <p>Card content</p> </div> </div> <div class="card w-full bg-base-300 shadow-lg"> <div class="card-body items-center text-center"> <img alt="Avatar Image"${addAttribute(avatar.src, "src")}> <h2 class="card-title">Translations</h2> <p>Card content</p> </div> </div> <div class="card w-full bg-base-300 shadow-lg"> <div class="card-body items-center text-center"> <img alt="Avatar Image"${addAttribute(avatar.src, "src")}> <h2 class="card-title">Grammar Check</h2> <p>Card content</p> </div> </div> <div class="card w-full bg-base-300 shadow-lg"> <div class="card-body items-center text-center"> <img alt="Avatar Image"${addAttribute(avatar.src, "src")}> <h2 class="card-title">Social Media Posts</h2> <p>Card content</p> </div> </div> <div class="card w-full md:w-64 lg:w-4/5 xl:w-4/5 border-neutral-focus border-dashed border bg-base-300 shadow-xl"> <div class="card-body items-center text-center"> <img alt="Avatar Image"${addAttribute(avatar.src, "src")}> <h2 class="card-title">customize your aibox</h2> </div> </div> </div> </div> </div> ` })}`;
}, "/home/steven/work/ai-toolbox/src/pages/index.astro", "self");

const $$file = "/home/steven/work/ai-toolbox/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
