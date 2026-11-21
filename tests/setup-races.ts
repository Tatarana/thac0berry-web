// Carrega as raças (thac0berry-data/data/races.json) antes de cada arquivo de teste
// (`--import` no script `test`): as regras de raça são síncronas e leem do registro de
// raceKit.ts, que no app é preenchido por `loadRaces()` antes do primeiro render.

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { setRaceData } from '../src/rules/raceKit.ts'

const source = resolve(process.env.DATA_DIR ?? join(import.meta.dirname, '..', '..', 'thac0berry-data', 'data'))
setRaceData(JSON.parse(readFileSync(join(source, 'races.json'), 'utf8')))
