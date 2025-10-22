import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

/**
 * Worker script to serve the SolidJS SPA from Cloudflare Workers
 * Handles routing and serves static assets from the dist folder
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);
  
  try {
    // Serve static assets using KV Asset Handler
    const response = await getAssetFromKV(event, {
      // For SPA routing: if a route is not found, serve index.html
      mapRequestToAsset: request => {
        const url = new URL(request.url);
        
        // If the path has a file extension, serve it as-is
        if (url.pathname.match(/\.\w+$/)) {
          return request;
        }
        
        // Otherwise, serve index.html for client-side routing
        url.pathname = '/index.html';
        return new Request(url.toString(), request);
      },
    });

    // Add security and caching headers
    const headers = new Headers(response.headers);
    
    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Cache control for different file types
    if (url.pathname.startsWith('/assets/')) {
      // Long cache for hashed assets
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname === '/' || url.pathname === '/index.html') {
      // No cache for the main HTML file
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  } catch (error) {
    // Handle errors
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

