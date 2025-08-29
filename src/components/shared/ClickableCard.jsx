import React, { useState, useRef, useEffect } from 'react'

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
function ClickableCard({ className = '', onClick, children, title, role = "button", ...props }) {
  const [anim, setAnim] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const triggerClickAnim = () => {
    // restart animation if already active
    setAnim(false)
    // next tick to reapply class
    requestAnimationFrame(() => {
      setAnim(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setAnim(false), 500)
    })
  }

  const handleActivate = (e) => {
    triggerClickAnim()
    onClick && onClick(e)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleActivate(e)
    }
  }

  const classes = `${className} ${anim ? 'click-anim' : ''}`.trim()

  return (
    <div
      className={classes}
      onClick={handleActivate}
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
