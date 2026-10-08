// Table Grimoire: as tabelas dos livros num arquivo só (public/data/tables.json,
// gerado por scripts/build-data.mjs com src/rules/tableIndex.ts).
import type { GrimoireTable } from '../rules/tableIndex'
import { loadData } from './load'

export const loadTables = () => loadData<GrimoireTable[]>('tables.json')
