/* empty css                                 */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_DGaccwLc.mjs';
import 'piccolore';
import 'html-escaper';
import { $ as $$Layout } from '../chunks/Layout_BDwF-l-k.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` <meta http-equiv="refresh" content="0;url=/login"> ` })}`;
}, "/workspace/src/pages/index.astro", void 0);

const $$file = "/workspace/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
