/* empty css                                       */
import { c as createComponent, r as renderTemplate, d as renderComponent, b as createAstro, m as maybeRenderHead } from '../../../chunks/astro/server_BvvS3v0v.mjs';
import { $ as $$Layout } from '../../../chunks/Layout_i1A0xYMe.mjs';
import { P as PromptModel } from '../../../chunks/prompt.model_CneM5GzG.mjs';
import { P as PromptForm } from '../../../chunks/PromptForm_DCvtU4mq.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const prompt = id ? await PromptModel.getAsString(id) : void 0;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div> ${renderComponent($$result2, "PromptForm", PromptForm, { "preferredLocale": Astro2.preferredLocale, "promptId": id, "prompt": prompt, "client:load": true, "client:component-hydration": "load", "client:component-path": "$pages/prompt-library/prompts/PromptForm.svelte", "client:component-export": "default" })} </div> ` })}`;
}, "/home/steven/work/ai-toolbox/src/pages/prompt-library/prompts/[id].astro", void 0);

const $$file = "/home/steven/work/ai-toolbox/src/pages/prompt-library/prompts/[id].astro";
const $$url = "/prompt-library/prompts/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
