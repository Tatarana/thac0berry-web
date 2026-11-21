// Publica a ilustração de um monstro (uso antigo; o trabalho é do add-site-art.mjs).
//   node scripts/add-monster-image.mjs <id> <arquivo> [--dry-run] [--new-version]
process.argv.splice(2, 0, 'monster')
await import('./add-site-art.mjs')