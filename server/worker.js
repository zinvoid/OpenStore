// Serve o build estático da OpenStore (dist/) em qualquer rota.
// A navegação usa HashRouter, então basta entregar os arquivos e cair no index.html.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404) return response
    return env.ASSETS.fetch(new URL('/index.html', request.url))
  },
}
