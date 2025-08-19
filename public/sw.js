// Secure service worker: cache-first for static assets only
const CACHE = 'verbos-v1'
const MAX_CACHE_SIZE = 50 // Maximum number of cached resources
const ASSETS = [
  '/',
  '/index.html',
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

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)
  
  // Only handle GET requests
  if (request.method !== 'GET') return
  
  // Only cache same-origin requests
  if (url.origin !== self.location.origin) return
  
  // Only cache static assets - exclude API routes and dynamic content
  const staticExtensions = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webmanifest)$/i
  const isStaticAsset = staticExtensions.test(url.pathname) || 
                       url.pathname === '/' || 
                       url.pathname === '/index.html'
  
  if (!isStaticAsset) return
  
  e.respondWith(
    caches.match(request).then(cached => {
      // Return cached version if available
      if (cached) return cached
      
      return fetch(request).then(resp => {
        // Don't cache responses with no-cache or no-store directives
        const cacheControl = resp.headers.get('cache-control')
        if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))) {
          return resp
        }
        
        // Only cache successful responses
        if (resp.status === 200) {
          const copy = resp.clone()
          caches.open(CACHE).then(async c => {
            await c.put(request, copy)
            await cleanupCache() // Clean up cache after adding new entries
          })
        }
        
        return resp
      }).catch(() => cached)
    })
  )
})


