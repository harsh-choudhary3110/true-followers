import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const siteUrl = env.VITE_SITE_URL ?? '';

  return {
    plugins: [
      react(),
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
      // Generate robots.txt + sitemap.xml with absolute URLs at build time.
      {
        name: 'seo-files',
        generateBundle() {
          const routes = ['/', '/guide', '/upload', '/tracker', '/faq', '/privacy'];
          const today = new Date().toISOString().slice(0, 10);
          const urls = routes
            .map(
              (r) =>
                `  <url><loc>${siteUrl}${r}</loc><lastmod>${today}</lastmod></url>`,
            )
            .join('\n');
          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
          const robots = `User-agent: *\nAllow: /\nDisallow: /results\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
          this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
        },
      },
    ],
    // Absolute base so deep-link routes (/guide, /faq) resolve assets from root
    // correctly with BrowserRouter. Deploy at the domain root.
    base: '/',
  };
});
