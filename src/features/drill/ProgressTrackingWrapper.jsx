// Wrapper para tracking de progreso en Drill

import { useEffect } from 'react'
import { useProgressTracking } from './useProgressTracking.js'

/**
 * Wrapper para tracking de progreso en Drill
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.currentItem - Ítem actual que se está practicando
 * @param {Function} props.onResult - Función que se llama cuando hay un resultado
 * @param {Function} props.onContinue - Función que se llama para continuar
 * @param {Object} props.result - Resultado actual
 * @returns {null} No renderiza nada, solo maneja tracking
 */
export function ProgressTrackingWrapper({ currentItem, onResult, result }) {
  // Hook para tracking de progreso
  const { 
    handleResult 
  } = useProgressTracking(currentItem, onResult)

  // Efecto para manejar continuación de sesión
  useEffect(() => {
    if (!result) {
      // Registrar fin de sesión cuando se reinicia
      // En una implementación completa, esto se haría en el momento adecuado
      console.log('🔄 Sesión reiniciada')
    }
  }, [result])

  // Este componente no renderiza nada
  return null
}