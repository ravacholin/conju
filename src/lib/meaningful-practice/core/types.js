/**
 * Definiciones de tipos y interfaces para el sistema de práctica significativa
 *
 * Este archivo contiene todas las definiciones de tipos TypeScript-style usando JSDoc
 * para documentar la estructura de datos del sistema de ejercicios.
 *
 * @fileoverview Tipos y interfaces del sistema de práctica significativa
 */

/**
 * @typedef {Object} ExercisePrompt
 * @property {string} [icon] - Emoji o icono para el prompt
 * @property {string} text - Texto del prompt o pregunta
 * @property {string} [prompt] - Texto alternativo del prompt
 * @property {string[]} expected - Verbos o respuestas esperadas
 * @property {string} context - Contexto temático del prompt
 */

/**
 * @typedef {Object} TimelineEvent
 * @property {string} time - Hora del evento (ej: "7:00")
 * @property {string} icon - Emoji para el evento
 * @property {string} prompt - Descripción del evento
 * @property {string} context - Contexto del evento
 */

/**
 * @typedef {Object} ChatScript
 * @property {string[]} userKeywords - Palabras clave que el usuario debe usar
 * @property {string} botResponse - Respuesta del bot cuando se detectan las palabras clave
 * @property {string} context - Contexto de la parte de la conversación
 */

/**
 * @typedef {Object} Exercise
 * @property {string} type - Tipo de ejercicio (timeline, prompts, chat, etc.)
 * @property {string} id - Identificador único del ejercicio
 * @property {string} title - Título del ejercicio
 * @property {string} description - Descripción del ejercicio
 * @property {string} category - Categoría temática
 * @property {string} difficulty - Nivel de dificultad
 * @property {ExercisePrompt[]} [prompts] - Lista de prompts (para tipo prompts/daily_routine)
 * @property {TimelineEvent[]} [events] - Eventos de timeline (para tipo timeline)
 * @property {string[]} [expectedVerbs] - Verbos esperados (para tipo timeline)
 * @property {string} [initialMessage] - Mensaje inicial (para tipo chat)
 * @property {ChatScript[]} [script] - Script de conversación (para tipo chat)
 */

/**
 * @typedef {Object} TenseExerciseData
 * @property {Exercise} main - Ejercicio principal
 * @property {Exercise[]} [alternatives] - Ejercicios alternativos
 */

/**
 * @typedef {Object} ExerciseFilter
 * @property {string} [type] - Filtrar por tipo de ejercicio
 * @property {string} [difficulty] - Filtrar por dificultad
 * @property {string} [category] - Filtrar por categoría
 * @property {boolean} [includeAlternatives] - Incluir ejercicios alternativos
 */

/**
 * @typedef {Object} UserResponse
 * @property {string} text - Texto de la respuesta del usuario
 * @property {number} timestamp - Timestamp de la respuesta
 * @property {string} exerciseId - ID del ejercicio respondido
 * @property {string} tense - Tiempo verbal del ejercicio
 */

/**
 * @typedef {Object} AssessmentResult
 * @property {boolean} correct - Si la respuesta es correcta
 * @property {number} score - Puntuación (0-1)
 * @property {string[]} foundVerbs - Verbos encontrados en la respuesta
 * @property {string[]} missingVerbs - Verbos faltantes
 * @property {string[]} errorTags - Etiquetas de clasificación de errores
 * @property {string} feedback - Mensaje de retroalimentación
 * @property {Object} [detailedAnalysis] - Análisis detallado opcional
 */

/**
 * @typedef {Object} ErrorClassification
 * @property {string} type - Tipo de error
 * @property {string} description - Descripción del error
 * @property {string} suggestion - Sugerencia de corrección
 * @property {number} severity - Severidad del error (1-5)
 */

/**
 * @typedef {Object} LanguageAnalysisResult
 * @property {string[]} verbs - Verbos encontrados
 * @property {string[]} tenses - Tiempos verbales detectados
 * @property {Object} grammarAnalysis - Análisis gramatical
 * @property {ErrorClassification[]} errors - Errores detectados
 * @property {number} complexity - Índice de complejidad del texto
 * @property {string} dominantTense - Tiempo verbal dominante
 */

/**
 * @typedef {Object} PersonalizationProfile
 * @property {string} userId - ID del usuario
 * @property {string[]} preferredCategories - Categorías preferidas
 * @property {string} preferredDifficulty - Dificultad preferida
 * @property {Object} strengths - Fortalezas del usuario por tiempo verbal
 * @property {Object} weaknesses - Debilidades del usuario por tiempo verbal
 * @property {Object} interestTopics - Temas de interés del usuario
 * @property {number} engagementLevel - Nivel de engagement (0-1)
 */

/**
 * @typedef {Object} ExerciseSession
 * @property {string} sessionId - ID de la sesión
 * @property {string} userId - ID del usuario
 * @property {string} exerciseId - ID del ejercicio
 * @property {string} tense - Tiempo verbal practicado
 * @property {number} startTime - Timestamp de inicio
 * @property {number} [endTime] - Timestamp de finalización
 * @property {UserResponse[]} responses - Respuestas del usuario
 * @property {AssessmentResult[]} assessments - Resultados de evaluación
 * @property {boolean} completed - Si la sesión se completó
 * @property {number} score - Puntuación final de la sesión
 */

/**
 * @typedef {Object} GamificationElement
 * @property {string} type - Tipo de elemento (badge, achievement, streak, etc.)
 * @property {string} id - Identificador único
 * @property {string} title - Título del elemento
 * @property {string} description - Descripción
 * @property {string} icon - Icono o emoji
 * @property {number} points - Puntos otorgados
 * @property {Object} criteria - Criterios para obtenerlo
 * @property {boolean} unlocked - Si está desbloqueado
 */

/**
 * @typedef {Object} ContentTemplate
 * @property {string} id - ID de la plantilla
 * @property {string} type - Tipo de plantilla
 * @property {string} category - Categoría temática
 * @property {Object} structure - Estructura de la plantilla
 * @property {string[]} variables - Variables que se pueden reemplazar
 * @property {Object} metadata - Metadatos adicionales
 */

/**
 * @typedef {Object} DynamicContent
 * @property {string} contentId - ID del contenido generado
 * @property {string} templateId - ID de la plantilla base
 * @property {string} generatedText - Texto generado
 * @property {Object} variables - Variables utilizadas
 * @property {number} generationTime - Tiempo de generación
 * @property {number} quality - Puntuación de calidad (0-1)
 */

/**
 * @typedef {Object} ExerciseStats
 * @property {number} totalExercises - Total de ejercicios
 * @property {Object} exercisesByTense - Ejercicios por tiempo verbal
 * @property {Object} exercisesByType - Ejercicios por tipo
 * @property {Object} exercisesByDifficulty - Ejercicios por dificultad
 * @property {Object} exercisesByCategory - Ejercicios por categoría
 */

/**
 * @typedef {Object} ProgressMetrics
 * @property {number} totalSessions - Total de sesiones
 * @property {number} completedSessions - Sesiones completadas
 * @property {number} averageScore - Puntuación promedio
 * @property {Object} performanceByTense - Rendimiento por tiempo verbal
 * @property {number} streakDays - Días consecutivos de práctica
 * @property {number} totalTimeSpent - Tiempo total de práctica (ms)
 */

/**
 * @typedef {Object} AdaptiveSettings
 * @property {string} currentDifficulty - Dificultad actual
 * @property {number} adaptationRate - Velocidad de adaptación (0-1)
 * @property {Object} performanceThresholds - Umbrales de rendimiento
 * @property {boolean} autoAdvance - Avance automático de dificultad
 * @property {Object} customWeights - Pesos personalizados para diferentes aspectos
 */

export {
  // Los tipos están definidos solo para documentación JSDoc
  // No se exporta nada real ya que JavaScript no tiene tipos en runtime
};