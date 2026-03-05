// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
  ],
  googleFonts: {
    families: {
      'Lato': [300, 400, 700, 900],
      'JetBrains Mono': [400, 500]
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true,
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      appUrl: process.env.APP_URL,
      posthogKey: process.env.POSTHOG_KEY,
      posthogHost: process.env.POSTHOG_HOST
    },
    githubToken: process.env.GITHUB_TOKEN,
    githubOwner: process.env.GITHUB_OWNER,
    githubRepo: process.env.GITHUB_REPO,
    githubBranch: process.env.GITHUB_BRANCH || 'main',
  }
})
