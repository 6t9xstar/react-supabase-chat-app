import '@astrojs/internal-helpers/path';
import '@astrojs/internal-helpers/remote';
import 'piccolore';
import 'html-escaper';
import 'clsx';
import { N as NOOP_MIDDLEWARE_HEADER, g as decodeKey } from './chunks/astro/server_DGaccwLc.mjs';
import 'es-module-lexer';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///workspace/","cacheDir":"file:///workspace/node_modules/.astro/","outDir":"file:///workspace/dist/","srcDir":"file:///workspace/src/","publicDir":"file:///workspace/public/","buildClientDir":"file:///workspace/dist/client/","buildServerDir":"file:///workspace/dist/server/","adapterName":"","routes":[{"file":"file:///workspace/dist/chat/index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_assets/index.CIiynJ6R.css"}],"routeData":{"route":"/chat","isIndex":true,"type":"page","pattern":"^\\/chat\\/?$","segments":[[{"content":"chat","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/chat/index.astro","pathname":"/chat","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///workspace/dist/login/index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_assets/index.CIiynJ6R.css"}],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///workspace/dist/offline/index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_assets/index.CIiynJ6R.css"}],"routeData":{"route":"/offline","isIndex":false,"type":"page","pattern":"^\\/offline\\/?$","segments":[[{"content":"offline","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/offline.astro","pathname":"/offline","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///workspace/dist/index.html","links":[],"scripts":[],"styles":[{"type":"external","src":"/_assets/index.CIiynJ6R.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/workspace/src/pages/chat/index.astro",{"propagation":"none","containsHead":true}],["/workspace/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/workspace/src/pages/login.astro",{"propagation":"none","containsHead":true}],["/workspace/src/pages/offline.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astro-page:src/pages/chat/index@_@astro":"pages/chat.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/offline@_@astro":"pages/offline.astro.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astrojs-manifest":"manifest_B5QGo3Ar.mjs","/workspace/src/components/App":"_assets/App.BKqEBYi6.js","/workspace/src/components/auth/LoginForm":"_assets/LoginForm.DH9YDd1y.js","@astrojs/react/client.js":"_assets/client.DiyoqXoZ.js","/workspace/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts":"_assets/Layout.astro_astro_type_script_index_0_lang.CNRRR81F.js","/workspace/src/layouts/Layout.astro?astro&type=script&index=1&lang.ts":"_assets/Layout.astro_astro_type_script_index_1_lang.tI1sAhvg.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/workspace/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts","window.isSecureContext&&\"serviceWorker\"in navigator&&window.addEventListener(\"load\",()=>{navigator.serviceWorker.register(\"/sw.js\",{updateViaCache:\"none\"}).catch(e=>{console.warn(\"Service worker registration failed:\",e)})});"],["/workspace/src/layouts/Layout.astro?astro&type=script&index=1&lang.ts","(()=>{const s=document.documentElement;s.classList.remove(\"no-js\"),s.classList.add(\"js\");const n=\"theme\",o=window.matchMedia(\"(prefers-color-scheme: dark)\"),c={light:\"#FFFFFF\",dark:\"#000000\"},r=()=>{try{return localStorage.getItem(n)}catch{return null}},d=e=>{let t=document.querySelector('meta[name=\"theme-color\"]');t||(t=document.createElement(\"meta\"),t.setAttribute(\"name\",\"theme-color\"),document.head.appendChild(t)),t.setAttribute(\"content\",e?c.dark:c.light)},a=e=>{const t=e===\"dark\"||e!==\"light\"&&o.matches;s.classList.toggle(\"dark\",t),s.setAttribute(\"data-theme\",t?\"dark\":\"light\"),s.style.colorScheme=t?\"dark\":\"light\",d(t)};a(r());const l=()=>{const e=r();(!e||e===\"system\")&&a(e||\"system\")};typeof o.addEventListener==\"function\"?o.addEventListener(\"change\",l):typeof o.addListener==\"function\"&&o.addListener(l),window.ApexTheme={get(){return r()||\"system\"},set(e){const m=new Set([\"light\",\"dark\",\"system\"]).has(e)?e:\"system\";try{localStorage.setItem(n,m)}catch{}a(m)},clear(){try{localStorage.removeItem(n)}catch{}a(\"system\")}}})();"]],"assets":["/file:///workspace/dist/chat/index.html","/file:///workspace/dist/login/index.html","/file:///workspace/dist/offline/index.html","/file:///workspace/dist/index.html"],"buildFormat":"directory","checkOrigin":false,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"VPiHwPOfV8BGDG8KVE/DQ8fTJV2BcJhbKkkZ4oqMjjQ="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
