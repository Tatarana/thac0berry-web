/** Valor vazio aparece como "—", como nas caixinhas da ficha do iPad. */
export const dash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(value)
