import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolveSiteUrl() {
  const raw =
    process.env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'https://parejas-round-robin.vercel.app';

  return raw.replace(/\/+$/, '');
}

function injectOgSiteUrl() {
  const siteUrl = resolveSiteUrl();
  return {
    name: 'inject-og-site-url',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl);
    },
  };
}

export default defineConfig({
  plugins: [react(), injectOgSiteUrl()],
});
