/**
 * Normaliza entradas de fecha a instancias Date válidas.
 * Devuelve null si no es posible convertir a Date.
 */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
