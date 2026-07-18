// Service worker mínimo — existe apenas para satisfazer os critérios de
// instalabilidade de PWA (Chrome/Android). Sem cache agressiva de propósito:
// o site tem conteúdo dinâmico (vagas, preços, sessão) que nunca deve ficar
// preso numa versão antiga.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // passthrough — deixa o browser tratar do pedido normalmente
});
