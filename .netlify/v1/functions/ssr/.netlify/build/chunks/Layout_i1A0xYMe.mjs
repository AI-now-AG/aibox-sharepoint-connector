import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute, d as renderComponent, b as createAstro, e as renderSlot, s as spreadAttributes, F as Fragment, u as unescapeHTML } from './astro/server_BvvS3v0v.mjs';
import { u as useTranslations, $ as $$Head } from './Head_BGho-qey.mjs';
/* empty css                         */
import { match, Pattern } from 'ts-pattern';
import { C as CategoryModel } from './category.model_BGsEiyL0.mjs';

const avatar = new Proxy({"src":"/_astro/Avatar.CXMeRQjb.svg","width":32,"height":32,"format":"svg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/steven/work/ai-toolbox/src/images/Avatar.svg";
							}
							
							return target[name];
						}
					});

/** @returns {void} */
function noop() {}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

/**
 * @template T
 * @param {string} type
 * @param {T} [detail]
 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
 * @returns {CustomEvent<T>}
 */
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
	return new CustomEvent(type, { detail, bubbles, cancelable });
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error('Function called outside component initialization');
	return current_component;
}

/**
 * Schedules a callback to run immediately before the component is unmounted.
 *
 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
 * only one that runs inside a server-side component.
 *
 * https://svelte.dev/docs/svelte#ondestroy
 * @param {() => any} fn
 * @returns {void}
 */
function onDestroy(fn) {
	get_current_component().$$.on_destroy.push(fn);
}

/**
 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
 *
 * Component events created with `createEventDispatcher` create a
 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
 * property and can contain any type of data.
 *
 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
 * ```ts
 * const dispatch = createEventDispatcher<{
 *  loaded: never; // does not take a detail argument
 *  change: string; // takes a detail argument of type string, which is required
 *  optional: number | null; // takes an optional detail argument of type number
 * }>();
 * ```
 *
 * https://svelte.dev/docs/svelte#createeventdispatcher
 * @template {Record<string, any>} [EventMap=any]
 * @returns {import('./public.js').EventDispatcher<EventMap>}
 */
function createEventDispatcher() {
	const component = get_current_component();
	return (type, detail, { cancelable = false } = {}) => {
		const callbacks = component.$$.callbacks[type];
		if (callbacks) {
			// TODO are there situations where events could be dispatched
			// in a server (non-DOM) environment?
			const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
			callbacks.slice().forEach((fn) => {
				fn.call(component, event);
			});
			return !event.defaultPrevented;
		}
		return true;
	};
}

// general each functions:

function ensure_array_like(array_like_or_iterator) {
	return array_like_or_iterator?.length !== undefined
		? array_like_or_iterator
		: Array.from(array_like_or_iterator);
}

const ATTR_REGEX = /[&"]/g;
const CONTENT_REGEX = /[&<]/g;

/**
 * Note: this method is performance sensitive and has been optimized
 * https://github.com/sveltejs/svelte/pull/5701
 * @param {unknown} value
 * @returns {string}
 */
function escape(value, is_attr = false) {
	const str = String(value);
	const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
	pattern.lastIndex = 0;
	let escaped = '';
	let last = 0;
	while (pattern.test(str)) {
		const i = pattern.lastIndex - 1;
		const ch = str[i];
		escaped += str.substring(last, i) + (ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : '&lt;');
		last = i + 1;
	}
	return escaped + str.substring(last);
}

/** @returns {string} */
function each(items, fn) {
	items = ensure_array_like(items);
	let str = '';
	for (let i = 0; i < items.length; i += 1) {
		str += fn(items[i], i);
	}
	return str;
}

function validate_component(component, name) {
	if (!component || !component.$$render) {
		if (name === 'svelte:component') name += ' this={...}';
		throw new Error(
			`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules. Otherwise you may need to fix a <${name}>.`
		);
	}
	return component;
}

let on_destroy;

/** @returns {{ render: (props?: {}, { $$slots, context }?: { $$slots?: {}; context?: Map<any, any>; }) => { html: any; css: { code: string; map: any; }; head: string; }; $$render: (result: any, props: any, bindings: any, slots: any, context: any) => any; }} */
function create_ssr_component(fn) {
	function $$render(result, props, bindings, slots, context) {
		const parent_component = current_component;
		const $$ = {
			on_destroy,
			context: new Map(context || (parent_component ? parent_component.$$.context : [])),
			// these will be immediately discarded
			on_mount: [],
			before_update: [],
			after_update: [],
			callbacks: blank_object()
		};
		set_current_component({ $$ });
		const html = fn(result, props, bindings, slots);
		set_current_component(parent_component);
		return html;
	}
	return {
		render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
			on_destroy = [];
			const result = { title: '', head: '', css: new Set() };
			const html = $$render(result, props, {}, $$slots, context);
			run_all(on_destroy);
			return {
				html,
				css: {
					code: Array.from(result.css)
						.map((css) => css.code)
						.join('\n'),
					map: null // TODO
				},
				head: result.title + result.head
			};
		},
		$$render
	};
}

/** @returns {string} */
function add_attribute(name, value, boolean) {
	if (value == null || (boolean)) return '';
	const assignment = `="${escape(value, true)}"`;
	return ` ${name}${assignment}`;
}

/* src/components/ThemeSwitcher.svelte generated by Svelte v4.2.18 */

const ThemeSwitcher = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let { message } = $$props;
	let { title } = $$props;

	if ($$props.message === void 0 && $$bindings.message && message !== void 0) $$bindings.message(message);
	if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
	return `<li><button>${escape(title)}</button></li>`;
});

const $$Astro$8 = createAstro();
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Header;
  const t = useTranslations(Astro2.preferredLocale);
  let navItems = [
    {
      name: t("header.introduction"),
      path: "/"
    },
    {
      name: t("header.about"),
      path: "/about"
    },
    {
      name: t("header.theme"),
      list: [
        {
          name: "Light",
          theme: "light"
        },
        {
          name: "Dark",
          theme: "dark"
        },
        {
          name: "Somedia",
          theme: "somedia"
        },
        {
          name: "Luxury",
          theme: "luxury"
        },
        {
          name: "Lemonade",
          theme: "lemonade"
        }
      ]
    }
  ];
  if (Astro2.locals.username != "Somedia") {
    let idx = navItems[2].list?.findIndex((e) => e.name == "Somedia");
    if (idx && idx > -1) {
      console.log(idx);
      navItems[2].list?.splice(idx, 1);
    }
  }
  return renderTemplate`${maybeRenderHead()}<header class="container-fluid mx-auto navbar"> <div class="navbar-start"> <div class="lg:hidden"> <label for="left-drawer-trigger" aria-label="open sidebar" class="btn btn-square btn-ghost"> <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path> </svg> </label> </div> <a href="/" class="btn btn-ghost text-2xl font-semibold flex flex-col"> <img src="/soki-somedia.png" alt="Somedia Logo" class="h-8 somedia"> <span class="non-somedia">aibox</span> </a> <div class="hidden lg:flex"> <ul class="menu menu-horizontal px-1"> ${navItems.map((item) => renderTemplate`<li> ${item.list ? renderTemplate`<details> <summary${addAttribute([], "class:list")}>${item.name}</summary> <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-30 mt-3 w-52 p-2 shadow border border-base-content/20"> ${item.list.map((subItem) => renderTemplate`${renderComponent($$result, "ThemeSwitcher", ThemeSwitcher, { "message": subItem.theme, "title": subItem.name, "client:load": true, "client:component-hydration": "load", "client:component-path": "$components/ThemeSwitcher.svelte", "client:component-export": "default" })}`)} </ul> </details>` : renderTemplate`<a${addAttribute(item.path, "href")}>${item.name}</a>`} </li>`)} </ul> </div> </div> <div class="navbar-end"> <div class="dropdown dropdown-end"> <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar"> <div class="w-10 rounded-full"> <img alt="Avatar Image"${addAttribute(avatar.src, "src")}> </div> </div> <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow border"> <li> <a class="justify-between">
Profile
<span class="badge">New</span> </a> </li> <li><a>Settings</a></li> <li id="logout"><a>Logout</a></li> </ul> </div> </div> </header> `;
}, "/home/steven/work/ai-toolbox/src/components/Header.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro$7 = createAstro();
const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$Footer;
  const t = useTranslations(Astro2.preferredLocale);
  return renderTemplate(_a || (_a = __template(["", '<footer class="footer footer-center bg-base-200 text-base-content rounded p-10"> <nav class="grid grid-flow-col gap-4"> <a class="link link-hover h-22">', '</a> <div class="divider lg:divider-horizontal"></div> <a class="link link-hover">', '</a> <div class="divider lg:divider-horizontal"></div> <a class="link link-hover">', '</a> </nav> <nav> <div class="grid grid-flow-col gap-4"> <a href="/" class="hover:text-blue-500"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current"> <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path> </svg> </a> <a href="/" class="hover:text-red-500"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current"> <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path> </svg> </a> <a href="/" class="hover:text-blue-700"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="fill-current"> <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path> </svg> </a> </div> </nav> <aside> <p>\nCopyright \xA9 ', ' - All right reserved by AI now AG\n</p> </aside> </footer> <!-- <script>\n  let copyRight = document.querySelector("#copyright")\n  if (copyRight) {\n    copyRight.textContent = new Date().getFullYear().toString()\n  }\n<\/script> -->'])), maybeRenderHead(), t("footer.how-it-works"), t("footer.privacy-policy"), t("footer.terms-of-service"), (/* @__PURE__ */ new Date()).getFullYear());
}, "/home/steven/work/ai-toolbox/src/components/Footer.astro", void 0);

const $$Astro$6 = createAstro();
const $$MenuItem = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$MenuItem;
  const { title, path } = Astro2.props;
  return renderTemplate`${match(path).with(void 0, () => renderTemplate`${maybeRenderHead()}<div class="menu-title font-normal text-base-content flex flex-row items-center gap-2">${renderSlot($$result, $$slots["icon"])}${title}</div>`).with(Pattern.string, () => renderTemplate`<a${addAttribute(path, "href")}${addAttribute(["font-semibold", { active: path === Astro2.url.pathname }], "class:list")}>${title}</a>`).exhaustive()}`;
}, "/home/steven/work/ai-toolbox/src/components/nav/MenuItem.astro", void 0);

const $$Astro$5 = createAstro();
const $$Apps = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Apps;
  const attr = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"${spreadAttributes(attr)}> <path fill="currentColor" fill-rule="evenodd" d="M17.5 2.75a.75.75 0 0 1 .75.75v2.25h2.25a.75.75 0 0 1 0 1.5h-2.25V9.5a.75.75 0 0 1-1.5 0V7.25H14.5a.75.75 0 0 1 0-1.5h2.25V3.5a.75.75 0 0 1 .75-.75" clip-rule="evenodd"></path> <path fill="currentColor" d="M2 6.5c0-2.121 0-3.182.659-3.841C3.318 2 4.379 2 6.5 2c2.121 0 3.182 0 3.841.659C11 3.318 11 4.379 11 6.5c0 2.121 0 3.182-.659 3.841C9.682 11 8.621 11 6.5 11c-2.121 0-3.182 0-3.841-.659C2 9.682 2 8.621 2 6.5m11 11c0-2.121 0-3.182.659-3.841C14.318 13 15.379 13 17.5 13c2.121 0 3.182 0 3.841.659c.659.659.659 1.72.659 3.841c0 2.121 0 3.182-.659 3.841c-.659.659-1.72.659-3.841.659c-2.121 0-3.182 0-3.841-.659C13 20.682 13 19.621 13 17.5m-11 0c0-2.121 0-3.182.659-3.841C3.318 13 4.379 13 6.5 13c2.121 0 3.182 0 3.841.659c.659.659.659 1.72.659 3.841c0 2.121 0 3.182-.659 3.841C9.682 22 8.621 22 6.5 22c-2.121 0-3.182 0-3.841-.659C2 20.682 2 19.621 2 17.5"></path> </svg>`;
}, "/home/steven/work/ai-toolbox/src/components/nav/icons/Apps.astro", void 0);

const $$Astro$4 = createAstro();
const $$Writing = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Writing;
  const attr = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 14 14"${spreadAttributes(attr)}> <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"> <path d="M7.5.5h-5a1 1 0 0 0-1 1v9l-1 3l4-1h8a1 1 0 0 0 1-1v-5"></path> <path d="m8.363 8.137l-3 .54l.5-3.04l4.73-4.71a.999.999 0 0 1 1.42 0l1.06 1.06a1.001 1.001 0 0 1 0 1.42z"></path> </g> </svg>`;
}, "/home/steven/work/ai-toolbox/src/components/nav/icons/Writing.astro", void 0);

const $$Astro$3 = createAstro();
const $$Settings = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Settings;
  const attr = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"${spreadAttributes(attr)}> <path fill="currentColor" d="m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zM11 20h1.975l.35-2.65q.775-.2 1.438-.587t1.212-.938l2.475 1.025l.975-1.7l-2.15-1.625q.125-.35.175-.737T17.5 12t-.05-.787t-.175-.738l2.15-1.625l-.975-1.7l-2.475 1.05q-.55-.575-1.212-.962t-1.438-.588L13 4h-1.975l-.35 2.65q-.775.2-1.437.588t-1.213.937L5.55 7.15l-.975 1.7l2.15 1.6q-.125.375-.175.75t-.05.8q0 .4.05.775t.175.75l-2.15 1.625l.975 1.7l2.475-1.05q.55.575 1.213.963t1.437.587zm1.05-4.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5M12 12"></path> </svg>`;
}, "/home/steven/work/ai-toolbox/src/components/nav/icons/Settings.astro", void 0);

const $$Astro$2 = createAstro();
var Name = /* @__PURE__ */ ((Name2) => {
  Name2[Name2["Apps"] = 0] = "Apps";
  Name2[Name2["Writing"] = 1] = "Writing";
  Name2[Name2["Settings"] = 2] = "Settings";
  return Name2;
})(Name || {});
const $$Icon = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Icon;
  const { icon, ...attrs } = Astro2.props;
  return renderTemplate`${match(icon).with(0 /* Apps */, () => renderTemplate`${renderComponent($$result, "AppsIcon", $$Apps, { ...attrs })}`).with(1 /* Writing */, () => renderTemplate`${renderComponent($$result, "WritingIcon", $$Writing, { ...attrs })}`).with(2 /* Settings */, () => renderTemplate`${renderComponent($$result, "SettingsIcon", $$Settings, { ...attrs })}`).run()}`;
}, "/home/steven/work/ai-toolbox/src/components/nav/icons/Icon.astro", void 0);

const $$Astro$1 = createAstro();
const $$Navigation = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Navigation;
  const t = useTranslations(Astro2.preferredLocale);
  const cursor = await CategoryModel.listByUser(Astro2.locals.userId);
  const categories = await cursor.toArray();
  const menuItems = categories.map((category) => ({
    title: category.title,
    icon: category.icon,
    items: category.groups?.map((group) => ({
      title: group.title,
      path: `/prompts/${category.slug}/${group.slug}`
    }))
  }));
  const modules = [
    /*{
        title: t("nav.text-writing"),
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
    	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor">
    		<path d="M10.55 3c-3.852.007-5.87.102-7.159 1.39C2 5.783 2 8.022 2 12.5s0 6.717 1.391 8.109C4.783 22 7.021 22 11.501 22c4.478 0 6.717 0 8.108-1.391c1.29-1.29 1.384-3.307 1.391-7.16" />
    		<path d="M11.056 13C10.332 3.866 16.802 1.276 21.98 2.164c.209 3.027-1.273 4.16-4.093 4.684c.545.57 1.507 1.286 1.403 2.18c-.074.638-.506.95-1.372 1.576c-1.896 1.37-4.093 2.234-6.863 2.396" />
    		<path d="M9 17c2-5.5 3.96-7.364 6-9" />
    	</g>
    </svg>`,
        items: [
          {
            title: "Headline",
            path: "/headlines",
          },
          {
            title: "Headline UI Demo",
            path: "/headlines/demo",
          },
          {
            title: "Summarize",
            path: "/summarize",
          },
          {
            title: "Shorten test",
            path: "/shorten-text",
          },
          {
            title: "Police Report",
            path: "/police-report",
          },
        ],
      },*/
    ...menuItems,
    {
      title: t("nav.settings"),
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
	<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor">
		<path d="M16.308 4.384c-.59 0-.886 0-1.155-.1l-.111-.046c-.261-.12-.47-.328-.888-.746c-.962-.962-1.443-1.443-2.034-1.488a2 2 0 0 0-.24 0c-.591.045-1.072.526-2.034 1.488c-.418.418-.627.627-.888.746l-.11.046c-.27.1-.565.1-1.156.1h-.11c-1.507 0-2.261 0-2.73.468s-.468 1.223-.468 2.73v.11c0 .59 0 .886-.1 1.155q-.022.057-.046.111c-.12.261-.328.47-.746.888c-.962.962-1.443 1.443-1.488 2.034a2 2 0 0 0 0 .24c.045.591.526 1.072 1.488 2.034c.418.418.627.627.746.888q.025.054.046.11c.1.27.1.565.1 1.156v.11c0 1.507 0 2.261.468 2.73s1.223.468 2.73.468h.11c.59 0 .886 0 1.155.1q.057.021.111.046c.261.12.47.328.888.746c.962.962 1.443 1.443 2.034 1.488q.12.009.24 0c.591-.045 1.072-.526 2.034-1.488c.418-.418.627-.626.888-.746q.054-.025.11-.046c.27-.1.565-.1 1.156-.1h.11c1.507 0 2.261 0 2.73-.468s.468-1.223.468-2.73v-.11c0-.59 0-.886.1-1.155q.021-.057.046-.111c.12-.261.328-.47.746-.888c.962-.962 1.443-1.443 1.488-2.034q.009-.12 0-.24c-.045-.591-.526-1.072-1.488-2.034c-.418-.418-.626-.627-.746-.888l-.046-.11c-.1-.27-.1-.565-.1-1.156v-.11c0-1.507 0-2.261-.468-2.73s-1.223-.468-2.73-.468z" />
		<path d="M15.5 12a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0" />
	</g>
</svg>`,
      items: [
        {
          title: t("nav.settings.prompts"),
          path: "/prompt-library/prompts"
        },
        {
          title: t("nav.settings.instructions"),
          path: "/prompt-library/instructions"
        },
        {
          title: t("nav.settings.knowledge-base"),
          path: "/prompt-library/knowledge-base"
        },
        {
          title: t("nav.settings.categories"),
          path: "/prompt-library/categories"
        }
      ]
    }
  ];
  return renderTemplate`${maybeRenderHead()}<nav class="flex flex-col bg-base-100 w-80 h-full"> <div> <div class="text-sm pl-6 pt-5 flex flex-row items-center gap-2"> ${renderComponent($$result, "Icon", $$Icon, { "icon": Name.Apps, "class": "w-4 h-4" })} <span>${t("nav.all-widgets")}</span> </div> <ul class="menu w-full pr-6"> ${modules.map((mod) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <li> <div class="border-t-base-content border-t rounded-none mt-4 ml-4 h-0 opacity-20"></div> </li> <li> ${renderComponent($$result2, "MenuItem", $$MenuItem, { ...mod }, { "icon": ($$result3) => renderTemplate`<div class="[&>svg]:h-5 [&>svg]:w-5"> ${mod.icon && renderTemplate`${renderComponent($$result3, "Fragment", Fragment, {}, { "default": ($$result4) => renderTemplate`${unescapeHTML(mod.icon)}` })}`} </div>` })} ${"items" in mod && renderTemplate`<ul> ${mod.items?.map((sub) => renderTemplate`<li class="pl-1"> ${renderComponent($$result2, "MenuItem", $$MenuItem, { ...sub })} </li>`)} </ul>`} </li> ` })}`)} </ul> </div> </nav>`;
}, "/home/steven/work/ai-toolbox/src/components/nav/Navigation.astro", void 0);

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const t = useTranslations(Astro2.preferredLocale);
  const {
    title = t("site.title"),
    description = t("site.description"),
    isFooterVisible = false
  } = Astro2.props;
  const theme = Astro2.locals.username === "Somedia" ? "somedia" : "light";
  return renderTemplate`<html lang="en"${addAttribute(theme, "data-theme")}> ${renderComponent($$result, "Head", $$Head, { "title": title, "description": description })}${maybeRenderHead()}<body class="min-h-screen grid grid-rows-[min-content_1fr]"> ${renderComponent($$result, "Header", $$Header, {})} <div class="drawer lg:drawer-open"> <input id="left-drawer-trigger" type="checkbox" class="drawer-toggle"> <div class="drawer-content grid grid-rows-[1fr_min-content]"> <main class="min-w-xs flex w-full flex-col lg:basis-2/3 bg-base-200 border-t border-l border-base-content/10"> ${renderSlot($$result, $$slots["default"])} </main> ${isFooterVisible && renderTemplate`${renderComponent($$result, "Footer", $$Footer, {})}`} </div> <div class="drawer-side top-16 z-20 lg:h-auto"> <label for="left-drawer-trigger" aria-label="close sidebar" class="drawer-overlay"></label> ${renderComponent($$result, "Navigation", $$Navigation, {})} </div> </div> </body></html>`;
}, "/home/steven/work/ai-toolbox/src/layouts/Layout.astro", void 0);

export { $$Layout as $, createEventDispatcher as a, add_attribute as b, create_ssr_component as c, each as d, escape as e, avatar as f, noop as n, onDestroy as o, safe_not_equal as s, validate_component as v };
