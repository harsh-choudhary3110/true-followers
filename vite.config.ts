import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const siteUrl = env.VITE_SITE_URL ?? '';

  return {
    plugins: [
      react(),
      // Progressive Web App: precache the built shell so the tool works offline
      // and can be installed. Reuses the existing public/site.webmanifest.
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        // We ship our own manifest at public/site.webmanifest (already linked in
        // index.html), so the plugin only handles the service worker.
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json,xml,txt}'],
          // Deep links / client-only routes (e.g. /results) fall back to the shell.
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.txt$/, /\.[^/]+$/],
          cleanupOutdatedCaches: true,
        },
      }),
      // Inject the site URL into index.html's __SITE_URL__ tokens at build time.
      {
        name: 'inject-site-url',
        transformIndexHtml: {
          order: 'pre' as const,
          handler(html: string) {
            return html.replaceAll('__SITE_URL__', siteUrl);
          },
        },
      },
      // Generate robots.txt + sitemap.xml + llms.txt with absolute URLs at build time.
      {
        name: 'seo-files',
        generateBundle() {
          const routes = [
            { path: '/', title: 'Home', blurb: 'Compare your Instagram followers and following to see who doesn\'t follow you back, who you don\'t follow back, and your mutuals.' },
            { path: '/guide', title: 'Guide', blurb: 'Step-by-step guide to download your Instagram followers and following data as JSON (or HTML).' },
            { path: '/upload', title: 'Upload', blurb: 'Drop your Instagram data export (ZIP, JSON or HTML) to analyze it. Processed entirely in your browser.' },
            { path: '/tracker', title: 'Unfollower tracker', blurb: 'Save snapshots privately in your browser and compare them over time to see who unfollowed you.' },
            { path: '/faq', title: 'FAQ', blurb: 'Answers about privacy, Instagram exports, JSON vs HTML, account safety, and how the tool works.' },
            { path: '/privacy', title: 'Privacy', blurb: 'Everything runs in your browser — nothing uploaded, no accounts, no ads, no cookies.' },
          ];
          const today = new Date().toISOString().slice(0, 10);

          const urls = routes
            .map(
              (r) =>
                `  <url><loc>${siteUrl}${r.path}</loc><lastmod>${today}</lastmod></url>`,
            )
            .join('\n');
          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

          // Blanket allow, but name the major AI crawlers explicitly so their
          // access is unambiguous (and easy to flip to Disallow later).
          const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Applebot-Extended'];
          const aiRules = aiBots
            .map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /results\n`)
            .join('\n');
          const robots = `User-agent: *\nAllow: /\nDisallow: /results\n\n${aiRules}\nSitemap: ${siteUrl}/sitemap.xml\n`;

          // llms.txt — concise, link-first summary for LLM answer engines.
          // https://llmstxt.org/
          const llms = [
            '# True Followers',
            '',
            '> Free, private Instagram follower tracker. Upload the official data export you download from Instagram to see who doesn\'t follow you back, who you don\'t follow back, your mutuals, and to track unfollowers over time. Everything runs in your browser — no login, no password, nothing uploaded, no accounts, and not affiliated with Instagram or Meta.',
            '',
            '## Pages',
            ...routes.map((r) => `- [${r.title}](${siteUrl}${r.path}): ${r.blurb}`),
            '',
          ].join('\n');

          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
          this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
          this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llms });
        },
      },
    ],
    // Absolute base so deep-link routes (/guide, /faq) resolve assets from root
    // correctly with BrowserRouter. Deploy at the domain root.
    base: '/',
  };
});
