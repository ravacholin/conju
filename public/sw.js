// Service Worker: fast assets, fresh HTML
// v3: network-first for navigation, cache-first for assets
const CACHE = 'verbos-v3'
const MAX_CACHE_SIZE = 80
const PRECACHE_ASSETS = [
  // Keep small, non-HTML assets only
  '/favicon.png'
]

// Clean up old cache entries when limit is exceeded
async function cleanupCache() {
  const cache = await caches.open(CACHE)
  const keys = await cache.keys()
  if (keys.length > MAX_CACHE_SIZE) {
    const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE)
    await Promise.all(keysToDelete.map(key => cache.delete(key)))
  }
}

self.addEventListener('install', (event) => {
  // Pre-cache only safe, small assets; avoid HTML to prevent staleness
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  // Take control immediately and remove old caches
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

function isNavigationRequest(request) {
  // Prefer the standard navigate mode; fallback to Accept header for Safari
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')
}

const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webmanifest)$/i

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Network-first for navigation/HTML to get fresh app shell
  if (isNavigationRequest(request)) {
    event.respondWith((async () => {
      try {
        const networkResp = await fetch(request)
        // Cache a copy of fresh HTML
        const copy = networkResp.clone()
        if (networkResp.ok) {
          const cache = await caches.open(CACHE)
          await cache.put(request, copy)
          cleanupCache()
        }
        return networkResp
      } catch {
        // Offline fallback to cached HTML if available
        const cache = await caches.open(CACHE)
        const cached = await cache.match(request)
        if (cached) return cached
        // As last resort serve cached index.html if present
        return (await cache.match('/index.html')) || Response.error()
      }
    })())
    return
  }

  // Cache-first for static versioned assets
  const isStaticAsset = staticExtensions.test(url.pathname)
  if (!isStaticAsset) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(request)
    if (cached) return cached
    try {
      const resp = await fetch(request)
      const cacheControl = resp.headers.get('cache-control') || ''
      if (resp.ok && !/no-cache|no-store/i.test(cacheControl)) {
        cache.put(request, resp.clone())
        cleanupCache()
      }
      return resp
    } catch (err) {
      return cached || Response.error()
    }
  })())
})

