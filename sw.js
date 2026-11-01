// Mis Cuentas: service worker mínimo para que el celular la pueda instalar como app.
// No guarda nada en caché: siempre carga la versión más nueva desde GitHub.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
