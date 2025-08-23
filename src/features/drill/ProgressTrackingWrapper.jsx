// Componente wrapper para integrar tracking de progreso en el Drill

import { useEffect } from 'react'
import { useProgressTracking } from './useProgressTracking.js'

// Este componente no renderiza nada, solo maneja el tracking de progreso
export function ProgressTrackingWrapper({ currentItem, onResult, onContinue, result }) {
  // Hook para tracking de progreso
  const { handleResult } = useProgressTracking(currentItem, (result) => {
    // Llamar al callback original si existe
    if (onResult) {
      onResult(result)
    }
  })
  
  // Efecto para manejar continuación de sesión
  useEffect(() => {
    if (!result) {
      // Registrar fin de sesión cuando se reinicia
      // En una implementación completa, esto se haría en el momento adecuado
    }
  }, [result])

  // Este componente no renderiza nada
  return null
}