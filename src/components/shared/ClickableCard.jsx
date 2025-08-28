import React from 'react'

/**
 * Componente accesible para elementos interactivos
 * 
 * Este componente reemplaza los <div> con onClick por elementos que cumplen
 * con estándares de accesibilidad WCAG:
 * 
 * - Navegación por teclado (Tab para enfocar, Enter/Espacio para activar)
 * - Roles ARIA apropiados para lectores de pantalla 
 * - Etiquetas aria-label descriptivas
 * - tabIndex=0 para incluir en el orden de tabulación
 * 
 * @param {string} className - Clases CSS a aplicar
 * @param {function} onClick - Función a ejecutar al hacer clic o presionar Enter/Espacio
 * @param {ReactNode} children - Contenido del elemento
 * @param {string} title - Título descriptivo para aria-label y title
 * @param {string} role - Rol ARIA (por defecto "button")
 */
function ClickableCard({ className, onClick, children, title, role = "button", ...props }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(e)
    }
  }

  return (
    <div
      className={className}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={role}
      tabIndex={0}
      title={title}
      aria-label={title}
      {...props}
    >
      {children}
    </div>
  )
}

export default ClickableCard