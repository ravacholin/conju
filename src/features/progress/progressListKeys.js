function readPathValue(item, path) {
  if (!item || !path) return ''
  const segments = path.split('.')
  let current = item
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return ''
    current = current[segment]
  }
  return current ?? ''
}

function serializePart(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

export function buildStableListKey(prefix, item, fields = [], fallback = '') {
  const normalizedPrefix = prefix || 'item'
  const parts = fields
    .map((field) => serializePart(readPathValue(item, field)))
    .filter((part) => part.length > 0)

  if (parts.length > 0) {
    return `${normalizedPrefix}|${parts.join('|')}`
  }

  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return `${normalizedPrefix}|${item}`
  }

  if (fallback) {
    return `${normalizedPrefix}|${fallback}`
  }

  return normalizedPrefix
}
