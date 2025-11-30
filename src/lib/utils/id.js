// Generador de IDs monotónicos y seguros para cliente/servidor
// Evita colisiones en la misma ms y favorece el orden temporal

let lastTs = 0;
let counter = 0;

function rand16() {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint16Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0];
  }
  return Math.floor(Math.random() * 0xffff);
}

function toBase36(n) {
  return n.toString(36);
}

/**
 * Genera un ID estable y ordenable por tiempo
 * @param {string} prefix prefijo legible (ej: 'attempt', 'schedule')
 * @returns {string}
 */
export function generateId(prefix = "id") {
  const now = Date.now();
  if (now === lastTs) {
    counter += 1;
  } else {
    lastTs = now;
    counter = 0;
  }
  const ts = toBase36(now);
  const cnt = toBase36(counter).padStart(2, "0");
  const rnd = `${toBase36(rand16())}${toBase36(rand16())}`;
  return `${prefix}-${ts}-${cnt}-${rnd}`;
}

/**
 * Genera un ID sólo-aleatorio con prefijo
 * Útil para casos donde el orden temporal no importa
 */
export function generateRandomId(prefix = "id") {
  const rnd = `${toBase36(rand16())}${toBase36(rand16())}${toBase36(rand16())}`;
  return `${prefix}-${rnd}`;
}
