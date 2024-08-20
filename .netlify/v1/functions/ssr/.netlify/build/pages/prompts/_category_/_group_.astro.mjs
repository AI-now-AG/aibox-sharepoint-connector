/* empty css                                       */
import { c as createComponent, r as renderTemplate, d as renderComponent, m as maybeRenderHead } from '../../../chunks/astro/server_BvvS3v0v.mjs';
import { $ as $$Layout } from '../../../chunks/Layout_i1A0xYMe.mjs';
import { $ as $$Content, a as $$History } from '../../../chunks/History_QdHR3v-v.mjs';
export { renderers } from '../../../renderers.mjs';

const $$group = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="grid grid-cols-1 md:grid-rows-[1fr_max-lg_minmax(min-content,_320px)] xl:grid-cols-[1fr_min-content_minmax(min-content,_320px)] bg-base-200 h-full"> <div class="p-6"> ${renderComponent($$result2, "Content", $$Content, {})} </div> <div class="divider xl:divider-horizontal"></div> <div class="px-4 xl:px-0 xl:py-6 xl:pr-6 xl:block"> ${renderComponent($$result2, "History", $$History, {})} </div> </div> ` })}`;
}, "/home/steven/work/ai-toolbox/src/pages/prompts/[category]/[group].astro", void 0);

const $$file = "/home/steven/work/ai-toolbox/src/pages/prompts/[category]/[group].astro";
const $$url = "/prompts/[category]/[group]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$group,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
