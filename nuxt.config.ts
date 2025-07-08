// nuxt.config.ts - Updated with impound configuration
export default defineNuxtConfig({
  modules: ["@nuxthub/core", "@nuxt/eslint", "nuxt-auth-utils", "@nuxt/ui"],

  devtools: { enabled: true },

  future: { compatibilityVersion: 4 },
  compatibilityDate: "2024-07-30",

  hub: {
    ai: true,
    database: false,
    blob: true,
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: "en",
      },
    },
  },

  css: ["~/assets/css/main.css"],

  nitro: {
    preset: 'cloudflare-pages',

    // 1) Switch to Webpack so bare imports don’t get dropped
    bundler: 'webpack',

    // 2) Ensure all of Drizzle + unenv runtime + bare specifiers get inlined
    externals: {
      inline: [
        'drizzle-orm/d1',
        'drizzle-orm/better-sqlite3',
        '@cloudflare/unenv-preset/dist/runtime/node/process.mjs',
        'node:process',
        'node:tls',
        'cloudflare:worker'
      ]
    },

    // 3) Turn off ESBuild tree-shaking entirely (Webpack will handle it)
    esbuild: {
      treeShaking: false
    },
  },

  build: {
    transpile: [
      '@nuxthub/core',
      'nuxt-auth-utils',
      'drizzle-orm'
    ]
  },
  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    sessionPassword: process.env.NUXT_SESSION_PASSWORD,
    hubProjectKey: process.env.NUXT_HUB_PROJECT_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareD1Token: process.env.CLOUDFLARE_D1_TOKEN,
    cloudflareD1DatabaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioApiKeySid: process.env.TWILIO_API_KEY_SID,
    twilioApiKeySecret: process.env.TWILIO_API_KEY_SECRET,
    twilioTwimlAppSid: process.env.TWILIO_TWIML_APP_SID,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: process.env.SMTP_SECURE,
    adminEmail: process.env.ADMIN_EMAIL,
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,

    public: {
      // Public keys (exposed to client-side)
      recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    }
  }
});