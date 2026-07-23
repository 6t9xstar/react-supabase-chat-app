/* empty css                                 */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DGaccwLc.mjs';
import 'piccolore';
import 'html-escaper';
import { $ as $$Layout } from '../chunks/Layout_BDwF-l-k.mjs';
export { renderers } from '../renderers.mjs';

const $$Offline = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="flex h-dvh flex-col items-center justify-center gap-4 bg-[#171717] px-4 text-center"> <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#2a2a2a]"> <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414"></path> </svg> </div> <h1 class="text-lg font-semibold text-[#ececec]">You're offline</h1> <p class="max-w-xs text-sm text-[#999]">Please check your connection and try again.</p> <a href="/chat" class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-400">
Try again
</a> </main> ` })}`;
}, "/workspace/src/pages/offline.astro", void 0);

const $$file = "/workspace/src/pages/offline.astro";
const $$url = "/offline";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Offline,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
