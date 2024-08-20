/* empty css                                    */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, e as renderSlot, d as renderComponent } from '../../chunks/astro/server_BvvS3v0v.mjs';
import { $ as $$Layout$1 } from '../../chunks/Layout_i1A0xYMe.mjs';
import { $ as $$Content, a as $$History } from '../../chunks/History_QdHR3v-v.mjs';
export { renderers } from '../../renderers.mjs';

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="grid grid-cols-1 xl:grid-cols-[1fr_min-content_minmax(min-content,_320px)] bg-base-200 h-full"> <div class="p-6"> ${renderSlot($$result, $$slots["content"])} </div> <div class="border-r border-base-content/20"></div> <div class="p-6 hidden xl:block"> ${renderSlot($$result, $$slots["prompt"])} </div> </div>`;
}, "/home/steven/work/ai-toolbox/src/components/prompt-interface/Layout.astro", void 0);

const $$PromptInterface = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "content": ($$result2) => renderTemplate`${renderComponent($$result2, "Content", $$Content, { "slot": "content" })}`, "prompt": ($$result2) => renderTemplate`${renderComponent($$result2, "History", $$History, { "slot": "prompt" })}` })}`;
}, "/home/steven/work/ai-toolbox/src/components/prompt-interface/PromptInterface.astro", void 0);

const $$Demo = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout$1, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "PromptInterface", $$PromptInterface, {})} ` })}`;
}, "/home/steven/work/ai-toolbox/src/pages/headlines/demo.astro", void 0);

const $$file = "/home/steven/work/ai-toolbox/src/pages/headlines/demo.astro";
const $$url = "/headlines/demo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Demo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
