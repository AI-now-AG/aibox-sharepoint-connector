/* empty css                                       */
import { c as createComponent, r as renderTemplate, d as renderComponent, b as createAstro } from '../../../chunks/astro/server_BvvS3v0v.mjs';
import { $ as $$Layout } from '../../../chunks/Layout_i1A0xYMe.mjs';
import { N as NewCategoryForm } from '../../../chunks/NewCategoryForm_BCl0Uemf.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$Add = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Add;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "NewCategoryForm", NewCategoryForm, { "preferredLocale": Astro2.preferredLocale, "client:load": true, "client:component-hydration": "load", "client:component-path": "$pages/prompt-library/categories/NewCategoryForm.svelte", "client:component-export": "default" })} ` })}`;
}, "/home/steven/work/ai-toolbox/src/pages/prompt-library/categories/add.astro", void 0);

const $$file = "/home/steven/work/ai-toolbox/src/pages/prompt-library/categories/add.astro";
const $$url = "/prompt-library/categories/add";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Add,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
