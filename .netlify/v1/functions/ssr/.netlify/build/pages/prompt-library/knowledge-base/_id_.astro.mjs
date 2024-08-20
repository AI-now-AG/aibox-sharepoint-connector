/* empty css                                       */
import { c as createComponent, r as renderTemplate, d as renderComponent, b as createAstro, m as maybeRenderHead } from '../../../chunks/astro/server_BvvS3v0v.mjs';
import { $ as $$Layout } from '../../../chunks/Layout_i1A0xYMe.mjs';
import { K as KnowledgeBaseModel } from '../../../chunks/knowledgeBase.model_DXrPTi6X.mjs';
import { K as KnowledgeBaseForm } from '../../../chunks/KnowledgeBaseForm_CeGNyHc3.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const knowledgeBase = id ? await KnowledgeBaseModel.get(id) : void 0;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div> ${renderComponent($$result2, "KnowledgeBaseForm", KnowledgeBaseForm, { "preferredLocale": Astro2.preferredLocale, "knowledgeBaseId": id, "knowledgeBase": knowledgeBase, "client:load": true, "client:component-hydration": "load", "client:component-path": "$pages/prompt-library/knowledge-base/KnowledgeBaseForm.svelte", "client:component-export": "default" })} </div> ` })}`;
}, "/home/steven/work/ai-toolbox/src/pages/prompt-library/knowledge-base/[id].astro", void 0);

const $$file = "/home/steven/work/ai-toolbox/src/pages/prompt-library/knowledge-base/[id].astro";
const $$url = "/prompt-library/knowledge-base/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
