// Contenido que la app dejó de practicar y que no debe aparecer en progreso
// ni en los reportes de error, aunque siga en el historial guardado del usuario.

/** Verbos pronominales que estuvieron en el dataset y se retiraron. */
export const RETIRED_LEMMAS = new Set(['sentarse', 'acostarse'])

/** Etiquetas de error que la clasificación ya no emite. */
export const RETIRED_ERROR_TAGS = new Set(['pronombres_clíticos'])

const isRetiredRecord = (record) =>
  RETIRED_LEMMAS.has(record?.verbId) || RETIRED_LEMMAS.has(record?.lemma)

const stripRetiredTags = (attempt) => {
  const tags = attempt?.errorTags
  if (!Array.isArray(tags) || !tags.some((tag) => RETIRED_ERROR_TAGS.has(tag))) {
    return attempt
  }
  return { ...attempt, errorTags: tags.filter((tag) => !RETIRED_ERROR_TAGS.has(tag)) }
}

/**
 * Descarta los intentos de verbos retirados y quita las etiquetas de error retiradas.
 * @param {Object[]} attempts
 * @returns {Object[]}
 */
export function withoutRetiredAttempts(attempts) {
  if (!Array.isArray(attempts)) return attempts
  return attempts.filter((attempt) => !isRetiredRecord(attempt)).map(stripRetiredTags)
}

/**
 * Descarta registros (schedules, etc.) de verbos retirados.
 * @param {Object[]} records
 * @returns {Object[]}
 */
export function withoutRetiredLemmas(records) {
  if (!Array.isArray(records)) return records
  return records.filter((record) => !isRetiredRecord(record))
}
