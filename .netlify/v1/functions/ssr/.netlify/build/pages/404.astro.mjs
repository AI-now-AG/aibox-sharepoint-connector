/* empty css                                 */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute } from '../chunks/astro/server_BvvS3v0v.mjs';
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="h-screen flex justify-center items-center bg-base-300"> <div class="container mx-auto p-4"> <div class="text-4xl font-bold mb-4">404 Not Found</div> <p class="text-lg">The page you're looking for doesn't exist.</p> <p class="text-lg">
Try checking the URL or going back to the
<a href="/"${addAttribute(["link"], "class:list")}> <span>homepage</span> </a>.
</p> </div> </div>`;
}, "/home/steven/work/ai-toolbox/src/pages/404.astro", void 0);

const $$file = "/home/steven/work/ai-toolbox/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
