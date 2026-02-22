/**
 * Cloudflare Worker: proxy instance.select/fumbler/* → fumbler.lovable.app/fumbler/*
 *
 * Setup:
 *   1. Go to Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. Paste this script
 *   3. Go to Workers → your worker → Triggers → Add Route
 *   4. Set route to: instance.select/fumbler/*
 *   5. Select your instance.select zone
 *
 * Because fumbler is built with vite `base: "/fumbler/"` and BrowserRouter
 * `basename="/fumbler"`, the paths are a 1:1 match — no rewriting needed.
 */

const UPSTREAM_ORIGIN = "https://fumbler.lovable.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Only handle /fumbler paths (safety check — route pattern should already enforce this)
    if (!url.pathname.startsWith("/fumbler")) {
      return fetch(request);
    }

    // Build the upstream URL, keeping the path and query string as-is
    const upstreamUrl = new URL(url.pathname + url.search, UPSTREAM_ORIGIN);

    // Clone headers, override Host to match upstream
    const headers = new Headers(request.headers);
    headers.set("Host", new URL(UPSTREAM_ORIGIN).host);
    headers.set("X-Forwarded-Host", url.host);
    headers.set("X-Forwarded-Proto", "https");

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual",
    });

    // Clone the response so we can modify headers
    const responseHeaders = new Headers(upstreamResponse.headers);

    // Remove any upstream cache/security headers that might interfere
    responseHeaders.delete("x-frame-options");

    // Allow the browser to cache assets but not HTML (SPA routing)
    const contentType = responseHeaders.get("content-type") || "";
    if (contentType.includes("text/html")) {
      responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
