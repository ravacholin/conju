import React from 'react';
import './AccentKeypad.css';

/**
 * AccentKeypad - Componente reutilizable para insertar caracteres acentuados
 *
 * Proporciona botones para caracteres especiales del español (á, é, í, ó, ú, ñ, ü)
 * que se insertan en el input activo o en un input específico mediante ref.
 *
 * @param {Object} props
 * @param {Function} props.onInsertChar - Callback que recibe el carácter a insertar
 * @param {Array<string>} props.characters - Array de caracteres a mostrar (default: caracteres españoles)
 * @param {string} props.className - Clase CSS adicional para el contenedor
 * @param {React.RefObject} props.targetRef - Ref del input donde insertar (opcional, si no se usa onInsertChar)
 * @param {Function} props.onValueChange - Callback para cambiar el valor del input (si se usa targetRef)
 */
export default function AccentKeypad({
  onInsertChar,
  characters = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'],
  className = '',
  targetRef = null,
  onValueChange = null
}) {

  const handleCharClick = (char) => {
    if (onInsertChar) {
      // Modo 1: Usar callback personalizado
      onInsertChar(char);
    } else if (targetRef?.current && onValueChange) {
      // Modo 2: Insertar en input específico usando ref
      const input = targetRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value;

      const newValue = currentValue.slice(0, start) + char + currentValue.slice(end);
      onValueChange(newValue);

      // Restaurar foco y posición del cursor
      setTimeout(() => {
        input.focus();
        const newCursorPos = start + char.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  return (
    <div className={`accent-keypad ${className}`}>
      {characters.map(ch => (
        <button
          key={ch}
          type="button"
          className="accent-key"
          onClick={() => handleCharClick(ch)}
          tabIndex={-1}
          aria-label={`Insertar ${ch}`}
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
