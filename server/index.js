function isNavigationRequest(request) {
  return request.method === "GET" && (request.headers.get("accept") || "").includes("text/html");
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || !isNavigationRequest(request)) return response;

    const url = new URL(request.url);
    url.pathname = "/index.html";
    url.search = "";
    return env.ASSETS.fetch(new Request(url, request));
  },
};
