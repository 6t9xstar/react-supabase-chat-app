/* empty css                                 */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DGaccwLc.mjs';
import 'piccolore';
import 'html-escaper';
import { $ as $$Layout } from '../chunks/Layout_BDwF-l-k.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { b as signIn, r as resetPassword } from '../chunks/auth_BIeveEvo.mjs';
import { MessageCircle, EyeOff, Eye, Loader2 } from 'lucide-react';
export { renderers } from '../renderers.mjs';

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      window.location.href = "/chat";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };
  const handleReset = async () => {
    if (!email.trim()) {
      setError("Enter your email address first");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm", children: /* @__PURE__ */ jsx(MessageCircle, { className: "h-8 w-8 text-white" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white", children: "Apex Chat" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-brand-200", children: "Internal Team Communication" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-white/10 p-8 backdrop-blur-sm", children: resetSent ? /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4 text-3xl", children: "📧" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-brand-100", children: "Check your email for a password reset link." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setResetSent(false),
          className: "mt-4 text-sm font-medium text-brand-300 hover:text-brand-200",
          children: "Back to login"
        }
      )
    ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleLogin, className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-brand-100", children: "Company Email" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "email",
            type: "email",
            required: true,
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "name@apexaccuracyestimatinginc.com",
            className: "mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-brand-300/50 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400",
            autoComplete: "email"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-brand-100", children: "Password" }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-1", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              type: showPassword ? "text" : "password",
              required: true,
              value: password,
              onChange: (e) => setPassword(e.target.value),
              placeholder: "Enter your password",
              className: "block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder-brand-300/50 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400",
              autoComplete: "current-password"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowPassword(!showPassword),
              className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-100",
              tabIndex: -1,
              "aria-label": "Toggle password visibility",
              children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
            }
          )
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300", children: error }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50",
          children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : "Sign in"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleReset,
          disabled: loading,
          className: "text-sm text-brand-300 hover:text-brand-200 disabled:opacity-50",
          children: "Forgot password?"
        }
      ) })
    ] }) })
  ] });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950"> ${renderComponent($$result2, "LoginForm", LoginForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/workspace/src/components/auth/LoginForm", "client:component-export": "default" })} </div> ` })}`;
}, "/workspace/src/pages/login.astro", void 0);

const $$file = "/workspace/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
