// A fila de arte dos heróis (../forge-art/heroes) e divindades: o mesmo monster-art-step.mjs,
// publicando com add-site-art.mjs deity. Mesmos comandos: next | ingest | skip | sheet | publish | wait.
//   node scripts/hero-art-step.mjs next <bloco>
import { fileURLToPath } from 'node:url'

process.argv.push('--dir', fileURLToPath(new URL('../../forge-art/heroes', import.meta.url)), '--kind', 'deity')
await import('./monster-art-step.mjs')