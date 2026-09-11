// Service Worker do "Mega dos Sonhos" — cacheia o app inteiro (é um arquivo
// único, então depois do primeiro carregamento tudo funciona offline,
// inclusive o Livro dos Sonhos e o histórico da Mega-Sena embutidos nele).
// A busca de concursos novos (botão "Buscar concursos novos") precisa de
// internet de verdade, já que consulta uma API externa em tempo real.

const CACHE_NOME = 'mega-dos-sonhos-v1';
const ARQUIVOS_PARA_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NOME)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (pra pegar atualizações do app quando
// online), e cai pro cache se estiver offline. Chamadas para a API de
// resultados da Mega-Sena (domínio externo) passam direto, sem cache — elas
// já têm seu próprio tratamento de erro dentro do app.
self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  if (url.origin !== self.location.origin) {
    return; // deixa passar direto (ex: API de resultados)
  }

  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(evento.request, copia));
        return resposta;
      })
      .catch(() => caches.match(evento.request))
  );
});
