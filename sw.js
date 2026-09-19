/**
 * SERVICE WORKER - LOCAR OFFLINE FIRST
 * Locar Guindastes e Transportes Intermodais
 * 
 * Garante que o inspetor no pátio de Betim execute todas as vistorias,
 * registre fotos e emita laudos mesmo sem conexão à internet.
 */

const CACHE_NAME = 'locar-inspecao-v2.1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/main.css',
    './css/components.css',
    './css/print.css',
    './js/app.js',
    './js/storage.js',
    './js/supabaseClient.js',
    './js/data/fleetData.js',
    './js/data/checklistNorms.js',
    './js/modules/fleetManager.js',
    './js/modules/inspectionEngine.js',
    './js/modules/pcmServiceRequests.js',
    './js/modules/reportGenerator.js',
    './js/modules/cameraManager.js',
    './js/modules/aiVisionInspector.js',
    './js/modules/aiCopilot.js',
    './js/modules/signaturePad.js',
    './assets/locar_logo.png',
    './assets/locar_logo_transparent.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pré-carregando assets críticos para operação offline no pátio...');
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.warn('[ServiceWorker] Aviso ao carregar alguns assets:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removendo cache legado:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Para requisições de API externa (ex: cdn FontAwesome, qrcodejs), tentar rede depois cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
