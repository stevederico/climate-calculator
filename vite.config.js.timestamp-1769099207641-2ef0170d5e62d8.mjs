// vite.config.js
import { defineConfig } from "file:///Users/sd/Dropbox/BixbyApps/Apps/BXClimate/node_modules/.deno/vite@7.3.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/sd/Dropbox/BixbyApps/Apps/BXClimate/node_modules/.deno/@vitejs+plugin-react-swc@4.2.2/node_modules/@vitejs/plugin-react-swc/index.js";
import tailwindcss from "file:///Users/sd/Dropbox/BixbyApps/Apps/BXClimate/node_modules/.deno/@tailwindcss+vite@4.1.18/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "node:path";
import fs from "node:fs";
var customLoggerPlugin = () => {
  return {
    name: "custom-logger",
    configureServer(server) {
      server.printUrls = () => {
        console.log(`React is running on http://localhost:${server.config.server.port || 5173}`);
      };
    }
  };
};
var htmlReplacePlugin = () => {
  return {
    name: "html-replace",
    transformIndexHtml(html) {
      const constants = JSON.parse(fs.readFileSync("src/constants.json", "utf8"));
      return html.replace(/{{APP_NAME}}/g, constants.appName).replace(/{{TAGLINE}}/g, constants.tagline).replace(/{{COMPANY_WEBSITE}}/g, constants.companyWebsite);
    }
  };
};
var dynamicRobotsPlugin = () => {
  return {
    name: "dynamic-robots",
    generateBundle() {
      const constants = JSON.parse(fs.readFileSync("src/constants.json", "utf8"));
      const website = constants.companyWebsite.startsWith("http") ? constants.companyWebsite : `https://${constants.companyWebsite}`;
      const robotsContent = `User-agent: Googlebot
Disallow: /app/
Disallow: /console/
Disallow: /signin/
Disallow: /signup/

User-agent: Bingbot
Disallow: /app/
Disallow: /console/
Disallow: /signin/
Disallow: /signup/

User-agent: Applebot
Disallow: /app/
Disallow: /console/
Disallow: /signin/
Disallow: /signup/

User-agent: facebookexternalhit
Disallow: /app/
Disallow: /console/
Disallow: /signin/
Disallow: /signup/

User-agent: Facebot
Disallow: /app/
Disallow: /console/
Disallow: /signin/
Disallow: /signup/

User-agent: Twitterbot
Disallow: /app/
Disallow: /console/
Disallow: /signin/
Disallow: /signup/

User-agent: *
Disallow: /

Sitemap: ${website}/sitemap.xml
`;
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: robotsContent
      });
    }
  };
};
var dynamicSitemapPlugin = () => {
  return {
    name: "dynamic-sitemap",
    generateBundle() {
      const constants = JSON.parse(fs.readFileSync("src/constants.json", "utf8"));
      const website = constants.companyWebsite.startsWith("http") ? constants.companyWebsite : `https://${constants.companyWebsite}`;
      const currentDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${website}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${website}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${website}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${website}/subs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${website}/eula</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: sitemapContent
      });
    }
  };
};
var dynamicManifestPlugin = () => {
  return {
    name: "dynamic-manifest",
    generateBundle() {
      const constants = JSON.parse(fs.readFileSync("src/constants.json", "utf8"));
      const manifestContent = {
        short_name: constants.appName,
        name: constants.appName,
        description: constants.tagline,
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          }
        ],
        start_url: "./app",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff"
      };
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifestContent, null, 2)
      });
    }
  };
};
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    customLoggerPlugin(),
    htmlReplacePlugin(),
    dynamicRobotsPlugin(),
    dynamicSitemapPlugin(),
    dynamicManifestPlugin()
  ],
  esbuild: {
    drop: []
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
      "@package": path.resolve(process.cwd(), "package.json"),
      "@root": path.resolve(process.cwd()),
      "react/jsx-runtime": path.resolve(process.cwd(), "node_modules/react/jsx-runtime.js")
    }
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@radix-ui/react-slot",
      "react-router-dom",
      "react-router",
      "cookie",
      "set-cookie-parser"
    ],
    force: true,
    exclude: [
      "@swc/core",
      "@swc/core-darwin-arm64",
      "@swc/wasm",
      "@tailwindcss/oxide",
      "@tailwindcss/oxide-darwin-arm64",
      "@tailwindcss/oxide-darwin-x64",
      "@tailwindcss/oxide-linux-x64-gnu",
      "@tailwindcss/oxide-linux-x64-musl",
      "@tailwindcss/oxide-win32-x64-msvc",
      "lightningcss",
      "fsevents"
    ],
    esbuildOptions: {
      target: "esnext",
      define: {
        global: "globalThis"
      }
    }
  },
  build: {
    rollupOptions: {
      external: [
        /\.node$/,
        /@tailwindcss\/oxide/
      ]
    }
  },
  server: {
    host: "localhost",
    open: false,
    port: 5173,
    strictPort: false,
    hmr: {
      port: 5173,
      overlay: false
    },
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**", "**/.git/**"]
    }
  },
  logLevel: "error"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlUm9vdCI6ICJmaWxlOi8vL1VzZXJzL3NkL0Ryb3Bib3gvQml4YnlBcHBzL0FwcHMvQlhDbGltYXRlLyIsCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NkL0Ryb3Bib3gvQml4YnlBcHBzL0FwcHMvQlhDbGltYXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvc2QvRHJvcGJveC9CaXhieUFwcHMvQXBwcy9CWENsaW1hdGUvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NkL0Ryb3Bib3gvQml4YnlBcHBzL0FwcHMvQlhDbGltYXRlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuXG4vKipcbiAqIEN1c3RvbSBsb2dnZXIgcGx1Z2luIHRvIHNpbXBsaWZ5IFZpdGUgc2VydmVyIHN0YXJ0dXAgb3V0cHV0XG4gKlxuICogT3ZlcnJpZGVzIGRlZmF1bHQgVml0ZSBVUkwgcHJpbnRlciB0byBzaG93IHNpbmdsZSBjbGVhbiBtZXNzYWdlLlxuICogU3VwcHJlc3NlcyB2ZXJib3NlIG5ldHdvcmsgYWRkcmVzcyBvdXRwdXQuXG4gKlxuICogQHJldHVybnMge2ltcG9ydCgndml0ZScpLlBsdWdpbn0gVml0ZSBwbHVnaW4gb2JqZWN0XG4gKi9cbmNvbnN0IGN1c3RvbUxvZ2dlclBsdWdpbiA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiAnY3VzdG9tLWxvZ2dlcicsXG4gICAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgICAgIHNlcnZlci5wcmludFVybHMgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFJlYWN0IGlzIHJ1bm5pbmcgb24gaHR0cDovL2xvY2FsaG9zdDoke3NlcnZlci5jb25maWcuc2VydmVyLnBvcnQgfHwgNTE3M31gKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLyoqXG4gKiBIVE1MIHRlbXBsYXRlIHZhcmlhYmxlIHJlcGxhY2VtZW50IHBsdWdpblxuICpcbiAqIFJlcGxhY2VzIHt7QVBQX05BTUV9fSwge3tUQUdMSU5FfX0sIHt7Q09NUEFOWV9XRUJTSVRFfX0gcGxhY2Vob2xkZXJzXG4gKiBpbiBpbmRleC5odG1sIHdpdGggdmFsdWVzIGZyb20gY29uc3RhbnRzLmpzb24gYXQgYnVpbGQgdGltZS4gRW5hYmxlc1xuICogZHluYW1pYyBtZXRhZGF0YSB3aXRob3V0IGJ1aWxkIHNjcmlwdCBjb21wbGV4aXR5LlxuICpcbiAqIEByZXR1cm5zIHtpbXBvcnQoJ3ZpdGUnKS5QbHVnaW59IFZpdGUgcGx1Z2luIG9iamVjdFxuICovXG5jb25zdCBodG1sUmVwbGFjZVBsdWdpbiA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiAnaHRtbC1yZXBsYWNlJyxcbiAgICAgICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnN0YW50cyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKCdzcmMvY29uc3RhbnRzLmpzb24nLCAndXRmOCcpKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0bWxcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgve3tBUFBfTkFNRX19L2csIGNvbnN0YW50cy5hcHBOYW1lKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC97e1RBR0xJTkV9fS9nLCBjb25zdGFudHMudGFnbGluZSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgve3tDT01QQU5ZX1dFQlNJVEV9fS9nLCBjb25zdGFudHMuY29tcGFueVdlYnNpdGUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogRHluYW1pYyByb2JvdHMudHh0IGdlbmVyYXRpb24gcGx1Z2luXG4gKlxuICogR2VuZXJhdGVzIHJvYm90cy50eHQgYXQgYnVpbGQgdGltZSB3aXRoOlxuICogLSBCb3Qtc3BlY2lmaWMgcnVsZXMgKEdvb2dsZWJvdCwgQmluZ2JvdCwgQXBwbGVib3QsIHNvY2lhbCBjcmF3bGVycylcbiAqIC0gUHJvdGVjdGVkIHJvdXRlcyAoL2FwcC8sIC9jb25zb2xlLywgL3NpZ25pbi8sIC9zaWdudXAvKVxuICogLSBTaXRlbWFwIHJlZmVyZW5jZSBmcm9tIGNvbnN0YW50cy5qc29uXG4gKiAtIERpc2FsbG93cyBhbGwgb3RoZXIgYm90cyBmcm9tIGVudGlyZSBzaXRlXG4gKlxuICogQHJldHVybnMge2ltcG9ydCgndml0ZScpLlBsdWdpbn0gVml0ZSBwbHVnaW4gb2JqZWN0XG4gKi9cbmNvbnN0IGR5bmFtaWNSb2JvdHNQbHVnaW4gPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogJ2R5bmFtaWMtcm9ib3RzJyxcbiAgICAgICAgZ2VuZXJhdGVCdW5kbGUoKSB7XG4gICAgICAgICAgICBjb25zdCBjb25zdGFudHMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnc3JjL2NvbnN0YW50cy5qc29uJywgJ3V0ZjgnKSk7XG4gICAgICAgICAgICBjb25zdCB3ZWJzaXRlID0gY29uc3RhbnRzLmNvbXBhbnlXZWJzaXRlLnN0YXJ0c1dpdGgoJ2h0dHAnKVxuICAgICAgICAgICAgICAgID8gY29uc3RhbnRzLmNvbXBhbnlXZWJzaXRlXG4gICAgICAgICAgICAgICAgOiBgaHR0cHM6Ly8ke2NvbnN0YW50cy5jb21wYW55V2Vic2l0ZX1gO1xuXG4gICAgICAgICAgICBjb25zdCByb2JvdHNDb250ZW50ID0gYFVzZXItYWdlbnQ6IEdvb2dsZWJvdFxuRGlzYWxsb3c6IC9hcHAvXG5EaXNhbGxvdzogL2NvbnNvbGUvXG5EaXNhbGxvdzogL3NpZ25pbi9cbkRpc2FsbG93OiAvc2lnbnVwL1xuXG5Vc2VyLWFnZW50OiBCaW5nYm90XG5EaXNhbGxvdzogL2FwcC9cbkRpc2FsbG93OiAvY29uc29sZS9cbkRpc2FsbG93OiAvc2lnbmluL1xuRGlzYWxsb3c6IC9zaWdudXAvXG5cblVzZXItYWdlbnQ6IEFwcGxlYm90XG5EaXNhbGxvdzogL2FwcC9cbkRpc2FsbG93OiAvY29uc29sZS9cbkRpc2FsbG93OiAvc2lnbmluL1xuRGlzYWxsb3c6IC9zaWdudXAvXG5cblVzZXItYWdlbnQ6IGZhY2Vib29rZXh0ZXJuYWxoaXRcbkRpc2FsbG93OiAvYXBwL1xuRGlzYWxsb3c6IC9jb25zb2xlL1xuRGlzYWxsb3c6IC9zaWduaW4vXG5EaXNhbGxvdzogL3NpZ251cC9cblxuVXNlci1hZ2VudDogRmFjZWJvdFxuRGlzYWxsb3c6IC9hcHAvXG5EaXNhbGxvdzogL2NvbnNvbGUvXG5EaXNhbGxvdzogL3NpZ25pbi9cbkRpc2FsbG93OiAvc2lnbnVwL1xuXG5Vc2VyLWFnZW50OiBUd2l0dGVyYm90XG5EaXNhbGxvdzogL2FwcC9cbkRpc2FsbG93OiAvY29uc29sZS9cbkRpc2FsbG93OiAvc2lnbmluL1xuRGlzYWxsb3c6IC9zaWdudXAvXG5cblVzZXItYWdlbnQ6ICpcbkRpc2FsbG93OiAvXG5cblNpdGVtYXA6ICR7d2Vic2l0ZX0vc2l0ZW1hcC54bWxcbmA7XG5cbiAgICAgICAgICAgIHRoaXMuZW1pdEZpbGUoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhc3NldCcsXG4gICAgICAgICAgICAgICAgZmlsZU5hbWU6ICdyb2JvdHMudHh0JyxcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHJvYm90c0NvbnRlbnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogRHluYW1pYyBzaXRlbWFwLnhtbCBnZW5lcmF0aW9uIHBsdWdpblxuICpcbiAqIEdlbmVyYXRlcyBzaXRlbWFwLnhtbCBhdCBidWlsZCB0aW1lIHdpdGggc3RhdGljIHBhZ2VzOlxuICogLSAvIChwcmlvcml0eSAxLjAsIHdlZWtseSlcbiAqIC0gL3Rlcm1zIChwcmlvcml0eSAwLjgsIG1vbnRobHkpXG4gKiAtIC9wcml2YWN5IChwcmlvcml0eSAwLjgsIG1vbnRobHkpXG4gKiAtIC9zdWJzIChwcmlvcml0eSAwLjcsIG1vbnRobHkpXG4gKiAtIC9ldWxhIChwcmlvcml0eSAwLjcsIG1vbnRobHkpXG4gKlxuICogVXNlcyBjdXJyZW50IGJ1aWxkIGRhdGUgZm9yIGxhc3Rtb2QuIFJlYWRzIHdlYnNpdGUgVVJMIGZyb20gY29uc3RhbnRzLmpzb24uXG4gKlxuICogQHJldHVybnMge2ltcG9ydCgndml0ZScpLlBsdWdpbn0gVml0ZSBwbHVnaW4gb2JqZWN0XG4gKi9cbmNvbnN0IGR5bmFtaWNTaXRlbWFwUGx1Z2luID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6ICdkeW5hbWljLXNpdGVtYXAnLFxuICAgICAgICBnZW5lcmF0ZUJ1bmRsZSgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnN0YW50cyA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKCdzcmMvY29uc3RhbnRzLmpzb24nLCAndXRmOCcpKTtcbiAgICAgICAgICAgIGNvbnN0IHdlYnNpdGUgPSBjb25zdGFudHMuY29tcGFueVdlYnNpdGUuc3RhcnRzV2l0aCgnaHR0cCcpXG4gICAgICAgICAgICAgICAgPyBjb25zdGFudHMuY29tcGFueVdlYnNpdGVcbiAgICAgICAgICAgICAgICA6IGBodHRwczovLyR7Y29uc3RhbnRzLmNvbXBhbnlXZWJzaXRlfWA7XG5cbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG5cbiAgICAgICAgICAgIGNvbnN0IHNpdGVtYXBDb250ZW50ID0gYDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/PlxuPHVybHNldCB4bWxucz1cImh0dHA6Ly93d3cuc2l0ZW1hcHMub3JnL3NjaGVtYXMvc2l0ZW1hcC8wLjlcIj5cbiAgPHVybD5cbiAgICA8bG9jPiR7d2Vic2l0ZX0vPC9sb2M+XG4gICAgPGxhc3Rtb2Q+JHtjdXJyZW50RGF0ZX08L2xhc3Rtb2Q+XG4gICAgPGNoYW5nZWZyZXE+d2Vla2x5PC9jaGFuZ2VmcmVxPlxuICAgIDxwcmlvcml0eT4xLjA8L3ByaW9yaXR5PlxuICA8L3VybD5cbiAgPHVybD5cbiAgICA8bG9jPiR7d2Vic2l0ZX0vdGVybXM8L2xvYz5cbiAgICA8bGFzdG1vZD4ke2N1cnJlbnREYXRlfTwvbGFzdG1vZD5cbiAgICA8Y2hhbmdlZnJlcT5tb250aGx5PC9jaGFuZ2VmcmVxPlxuICAgIDxwcmlvcml0eT4wLjg8L3ByaW9yaXR5PlxuICA8L3VybD5cbiAgPHVybD5cbiAgICA8bG9jPiR7d2Vic2l0ZX0vcHJpdmFjeTwvbG9jPlxuICAgIDxsYXN0bW9kPiR7Y3VycmVudERhdGV9PC9sYXN0bW9kPlxuICAgIDxjaGFuZ2VmcmVxPm1vbnRobHk8L2NoYW5nZWZyZXE+XG4gICAgPHByaW9yaXR5PjAuODwvcHJpb3JpdHk+XG4gIDwvdXJsPlxuICA8dXJsPlxuICAgIDxsb2M+JHt3ZWJzaXRlfS9zdWJzPC9sb2M+XG4gICAgPGxhc3Rtb2Q+JHtjdXJyZW50RGF0ZX08L2xhc3Rtb2Q+XG4gICAgPGNoYW5nZWZyZXE+bW9udGhseTwvY2hhbmdlZnJlcT5cbiAgICA8cHJpb3JpdHk+MC43PC9wcmlvcml0eT5cbiAgPC91cmw+XG4gIDx1cmw+XG4gICAgPGxvYz4ke3dlYnNpdGV9L2V1bGE8L2xvYz5cbiAgICA8bGFzdG1vZD4ke2N1cnJlbnREYXRlfTwvbGFzdG1vZD5cbiAgICA8Y2hhbmdlZnJlcT5tb250aGx5PC9jaGFuZ2VmcmVxPlxuICAgIDxwcmlvcml0eT4wLjc8L3ByaW9yaXR5PlxuICA8L3VybD5cbjwvdXJsc2V0PmA7XG5cbiAgICAgICAgICAgIHRoaXMuZW1pdEZpbGUoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhc3NldCcsXG4gICAgICAgICAgICAgICAgZmlsZU5hbWU6ICdzaXRlbWFwLnhtbCcsXG4gICAgICAgICAgICAgICAgc291cmNlOiBzaXRlbWFwQ29udGVudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLyoqXG4gKiBEeW5hbWljIFBXQSBtYW5pZmVzdC5qc29uIGdlbmVyYXRpb24gcGx1Z2luXG4gKlxuICogR2VuZXJhdGVzIFdlYiBBcHAgTWFuaWZlc3QgYXQgYnVpbGQgdGltZSB3aXRoOlxuICogLSBBcHAgbmFtZSBhbmQgZGVzY3JpcHRpb24gZnJvbSBjb25zdGFudHMuanNvblxuICogLSBJY29uIGNvbmZpZ3VyYXRpb24gKDE5MngxOTIgU1ZHKVxuICogLSBTdGFuZGFsb25lIGRpc3BsYXkgbW9kZVxuICogLSBTdGFydCBVUkwgcG9pbnRpbmcgdG8gL2FwcFxuICogLSBCbGFjayB0aGVtZSBjb2xvciwgd2hpdGUgYmFja2dyb3VuZFxuICpcbiAqIEVuYWJsZXMgQWRkIHRvIEhvbWUgU2NyZWVuIGFuZCBQV0EgZnVuY3Rpb25hbGl0eS5cbiAqXG4gKiBAcmV0dXJucyB7aW1wb3J0KCd2aXRlJykuUGx1Z2lufSBWaXRlIHBsdWdpbiBvYmplY3RcbiAqL1xuY29uc3QgZHluYW1pY01hbmlmZXN0UGx1Z2luID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6ICdkeW5hbWljLW1hbmlmZXN0JyxcbiAgICAgICAgZ2VuZXJhdGVCdW5kbGUoKSB7XG4gICAgICAgICAgICBjb25zdCBjb25zdGFudHMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYygnc3JjL2NvbnN0YW50cy5qc29uJywgJ3V0ZjgnKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG1hbmlmZXN0Q29udGVudCA9IHtcbiAgICAgICAgICAgICAgICBzaG9ydF9uYW1lOiBjb25zdGFudHMuYXBwTmFtZSxcbiAgICAgICAgICAgICAgICBuYW1lOiBjb25zdGFudHMuYXBwTmFtZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogY29uc3RhbnRzLnRhZ2xpbmUsXG4gICAgICAgICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiBcIi9pY29ucy9pY29uLnN2Z1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9zdmcreG1sXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgc3RhcnRfdXJsOiBcIi4vYXBwXCIsXG4gICAgICAgICAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgICAgICAgICAgdGhlbWVfY29sb3I6IFwiIzAwMDAwMFwiLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2ZmZmZmZlwiXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmVtaXRGaWxlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXNzZXQnLFxuICAgICAgICAgICAgICAgIGZpbGVOYW1lOiAnbWFuaWZlc3QuanNvbicsXG4gICAgICAgICAgICAgICAgc291cmNlOiBKU09OLnN0cmluZ2lmeShtYW5pZmVzdENvbnRlbnQsIG51bGwsIDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vLyA9PT09PSBWSVRFIENPTkZJR1VSQVRJT04gPT09PT1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdGFpbHdpbmRjc3MoKSxcbiAgICBjdXN0b21Mb2dnZXJQbHVnaW4oKSxcbiAgICBodG1sUmVwbGFjZVBsdWdpbigpLFxuICAgIGR5bmFtaWNSb2JvdHNQbHVnaW4oKSxcbiAgICBkeW5hbWljU2l0ZW1hcFBsdWdpbigpLFxuICAgIGR5bmFtaWNNYW5pZmVzdFBsdWdpbigpXG4gIF0sXG4gIGVzYnVpbGQ6IHtcbiAgICBkcm9wOiBbXVxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICcuL3NyYycpLFxuICAgICAgJ0BwYWNrYWdlJzogcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdwYWNrYWdlLmpzb24nKSxcbiAgICAgICdAcm9vdCc6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpKSxcbiAgICAgICdyZWFjdC9qc3gtcnVudGltZSc6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnbm9kZV9tb2R1bGVzL3JlYWN0L2pzeC1ydW50aW1lLmpzJylcbiAgICB9XG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1kb20vY2xpZW50JyxcbiAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2xvdCcsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyJyxcbiAgICAgICdjb29raWUnLFxuICAgICAgJ3NldC1jb29raWUtcGFyc2VyJ1xuICAgIF0sXG4gICAgZm9yY2U6IHRydWUsXG4gICAgZXhjbHVkZTogW1xuICAgICAgJ0Bzd2MvY29yZScsXG4gICAgICAnQHN3Yy9jb3JlLWRhcndpbi1hcm02NCcsXG4gICAgICAnQHN3Yy93YXNtJyxcbiAgICAgICdAdGFpbHdpbmRjc3Mvb3hpZGUnLFxuICAgICAgJ0B0YWlsd2luZGNzcy9veGlkZS1kYXJ3aW4tYXJtNjQnLFxuICAgICAgJ0B0YWlsd2luZGNzcy9veGlkZS1kYXJ3aW4teDY0JyxcbiAgICAgICdAdGFpbHdpbmRjc3Mvb3hpZGUtbGludXgteDY0LWdudScsXG4gICAgICAnQHRhaWx3aW5kY3NzL294aWRlLWxpbnV4LXg2NC1tdXNsJyxcbiAgICAgICdAdGFpbHdpbmRjc3Mvb3hpZGUtd2luMzIteDY0LW1zdmMnLFxuICAgICAgJ2xpZ2h0bmluZ2NzcycsXG4gICAgICAnZnNldmVudHMnXG4gICAgXSxcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICAgIGRlZmluZToge1xuICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJ1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogW1xuICAgICAgICAvXFwubm9kZSQvLFxuICAgICAgICAvQHRhaWx3aW5kY3NzXFwvb3hpZGUvXG4gICAgICBdXG4gICAgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBvcGVuOiBmYWxzZSxcbiAgICBwb3J0OiA1MTczLFxuICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICAgIGhtcjoge1xuICAgICAgcG9ydDogNTE3MyxcbiAgICAgIG92ZXJsYXk6IGZhbHNlXG4gICAgfSxcbiAgICB3YXRjaDoge1xuICAgICAgdXNlUG9sbGluZzogZmFsc2UsXG4gICAgICBpZ25vcmVkOiBbJyoqL25vZGVfbW9kdWxlcy8qKicsICcqKi8uZ2l0LyoqJ11cbiAgICB9XG4gIH0sXG4gIGxvZ0xldmVsOiAnZXJyb3InXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1QsU0FBUyxvQkFBb0I7QUFDN1UsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFVZixJQUFN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
