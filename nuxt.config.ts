export default defineNuxtConfig({
  modules: ["@nuxthub/core", "@nuxt/eslint", "nuxt-auth-utils", "@nuxt/ui"],
 // Single, unified Nitro section:
  nitro: {
    // We are deploying to Cloudflare Pages via nuxthub,
    // but we do NOT want the built-in D1 plugin.
    preset: 'cloudflare-pages',
    plugins: {
      // This is the actual plugin name Nitro uses under the hood—
      // not "nitropack-plugin-cloudflare-pages-d1".
      "@nitro/plugin-cloudflare-pages-d1": false
    }
  },
  devtools: { enabled: true },

  future: { compatibilityVersion: 4 },
  compatibilityDate: "2024-07-30",

  
  hub: {
    ai: false,       // ← this turns on CF-AI
    database: false,
    blob: true,
  },

  eslint: {
    config: { stylistic: false },
  },

  app: {
    head: {
      htmlAttrs: { lang: "en" },
    },
  },

  css: ["~/assets/css/main.css"],


  runtimeConfig: {
    // only available server-side
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      apiKeySid: process.env.TWILIO_API_KEY_SID,
      apiKeySecret: process.env.TWILIO_API_KEY_SECRET,
      twimlAppSid: process.env.TWILIO_TWIML_APP_SID,
    },
    // anything under `public` is exposed client-side
    public: {}
  },
});
// Uncomment if you use Safari in dev
// Create the key and crt in the root dir using:
// 1. openssl genrsa 2048 > server.key
// 2. chmod 400 server.key
// 3. openssl req -new -x509 -nodes -sha256 -days 365 -key server.key -out server.crt
// More info: https://github.com/atinux/nuxt-auth-utils/issues/78#issuecomment-2059231741
// devServer: {
//   https: {
//     key: "./server.key",
//     cert: "./server.crt",
//   },
// },