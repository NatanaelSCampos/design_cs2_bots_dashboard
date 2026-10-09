// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

/**
 * Site privado da Liga do Lobby.
 *
 * SSR, nao estatico: as paginas chamam o Worker do lado do SERVIDOR, assinando
 * com o segredo HMAC. O segredo nunca chega ao navegador — e a razao de o site
 * nao poder ser estatico.
 *
 * Adaptador node para desenvolvimento local. Para publicar na Cloudflare, troca
 * para @astrojs/cloudflare; o resto do codigo nao muda.
 */
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  vite: { plugins: [tailwindcss()] },
  server: { port: 4321 },
  devToolbar: { enabled: false },
});
