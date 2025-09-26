export function normalizeFormValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function normalizeTextForComparison(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return normalizeFormValue(value.replace(/[.,!?;:]/g, ' ')).replace(/\s+/g, ' ').trim();
}
