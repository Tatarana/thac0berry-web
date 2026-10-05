// Carrega (uma vez por sessão) um JSON gerado em public/data/ por
// scripts/build-data.mjs.
const cache = new Map<string, Promise<unknown>>()

export function loadData<T>(file: string): Promise<T> {
  let promise = cache.get(file)
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}data/${file}`).then((response) => {
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`)
      return response.json()
    })
    cache.set(file, promise)
  }
  return promise as Promise<T>
}
