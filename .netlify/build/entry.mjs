import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BTtSMVX6.mjs';
import { onRequest } from './_astro-internal_middleware.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/api/categories.json.astro.mjs');
const _page4 = () => import('./pages/api/headlines.json.astro.mjs');
const _page5 = () => import('./pages/api/instructions.json.astro.mjs');
const _page6 = () => import('./pages/api/knowledge-base.json.astro.mjs');
const _page7 = () => import('./pages/api/login.astro.mjs');
const _page8 = () => import('./pages/api/logout.astro.mjs');
const _page9 = () => import('./pages/api/promptexecution.json.astro.mjs');
const _page10 = () => import('./pages/api/prompts.json.astro.mjs');
const _page11 = () => import('./pages/headlines/demo.astro.mjs');
const _page12 = () => import('./pages/headlines.astro.mjs');
const _page13 = () => import('./pages/login.astro.mjs');
const _page14 = () => import('./pages/prompt-library/categories/add.astro.mjs');
const _page15 = () => import('./pages/prompt-library/categories/_id_.astro.mjs');
const _page16 = () => import('./pages/prompt-library/categories.astro.mjs');
const _page17 = () => import('./pages/prompt-library/instructions/add.astro.mjs');
const _page18 = () => import('./pages/prompt-library/instructions/_id_.astro.mjs');
const _page19 = () => import('./pages/prompt-library/instructions.astro.mjs');
const _page20 = () => import('./pages/prompt-library/knowledge-base/add.astro.mjs');
const _page21 = () => import('./pages/prompt-library/knowledge-base/_id_.astro.mjs');
const _page22 = () => import('./pages/prompt-library/knowledge-base.astro.mjs');
const _page23 = () => import('./pages/prompt-library/prompts/add.astro.mjs');
const _page24 = () => import('./pages/prompt-library/prompts/_id_.astro.mjs');
const _page25 = () => import('./pages/prompt-library/prompts.astro.mjs');
const _page26 = () => import('./pages/prompts/_category_/_group_.astro.mjs');
const _page27 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/.pnpm/astro@4.14.3_@types+node@22.4.1_rollup@4.21.0_typescript@5.5.4/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/api/categories.json.ts", _page3],
    ["src/pages/api/headlines.json.ts", _page4],
    ["src/pages/api/instructions.json.ts", _page5],
    ["src/pages/api/knowledge-base.json.ts", _page6],
    ["src/pages/api/login.ts", _page7],
    ["src/pages/api/logout.ts", _page8],
    ["src/pages/api/promptExecution.json.ts", _page9],
    ["src/pages/api/prompts.json.ts", _page10],
    ["src/pages/headlines/demo.astro", _page11],
    ["src/pages/headlines/index.astro", _page12],
    ["src/pages/login/index.astro", _page13],
    ["src/pages/prompt-library/categories/add.astro", _page14],
    ["src/pages/prompt-library/categories/[id].astro", _page15],
    ["src/pages/prompt-library/categories/index.astro", _page16],
    ["src/pages/prompt-library/instructions/add.astro", _page17],
    ["src/pages/prompt-library/instructions/[id].astro", _page18],
    ["src/pages/prompt-library/instructions/index.astro", _page19],
    ["src/pages/prompt-library/knowledge-base/add.astro", _page20],
    ["src/pages/prompt-library/knowledge-base/[id].astro", _page21],
    ["src/pages/prompt-library/knowledge-base/index.astro", _page22],
    ["src/pages/prompt-library/prompts/add.astro", _page23],
    ["src/pages/prompt-library/prompts/[id].astro", _page24],
    ["src/pages/prompt-library/prompts/index.astro", _page25],
    ["src/pages/prompts/[category]/[group].astro", _page26],
    ["src/pages/index.astro", _page27]
]);
const serverIslandMap = new Map();

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: onRequest
});
const _args = {
    "middlewareSecret": "c3c691e6-f3d1-42dd-a33e-b493be32b2a8"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
