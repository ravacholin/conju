# Módulo de Aprendizaje de Tiempos Verbales (`learn`)

Este documento detalla el funcionamiento del módulo para aprender un nuevo tiempo verbal, ubicado en el branch `learn`.

## Propósito

El objetivo de este módulo es guiar al usuario a través de un proceso estructurado y pedagógico para la adquisición de un nuevo tiempo verbal. El flujo está diseñado para pasar de una presentación teórica a una práctica controlada y, finalmente, a una práctica libre y gamificada, asegurando una base sólida antes de la evaluación.

## Flujo del Usuario

El proceso consta de cinco etapas secuenciales:

### 1. Selección y Configuración

- **Componente Principal:** `LearnTenseFlow.jsx`
- **Descripción:** Es la pantalla de inicio del módulo. Aquí, el usuario selecciona:
    - El **tiempo verbal** que desea aprender (ej. Presente de Indicativo).
    - La **duración** de la sesión (5, 10 o 15 minutos).
    - El **tipo de verbos** a practicar (regulares, irregulares o todos).

### 2. Presentación Inicial

- **Componente Principal:** `NarrativeIntroduction.jsx`
- **Descripción:** Una vez configurada la sesión, se presenta una introducción teórica al tiempo verbal. Esta pantalla muestra:
    - **Frases de Ejemplo:** Oraciones que usan el tiempo verbal en un contexto narrativo.
    - **Deconstrucción de Verbos:** Se muestran tres verbos modelo (-ar, -er, -ir) con sus raíces y la lista completa de terminaciones para todas las personas.

### 3. Drill Guiado de Terminaciones

- **Componente Principal:** `EndingsDrill.jsx`
- **Descripción:** Esta es la etapa central del nuevo flujo de aprendizaje. Su objetivo es solidificar la memorización de las terminaciones de forma controlada. El proceso es el siguiente:
    1.  Se practica **un solo verbo a la vez**, comenzando por el modelo `-ar` de la pantalla anterior.
    2.  **Práctica Aleatoria:** El componente pregunta las conjugaciones para los distintos pronombres (yo, tú, él...) en un **orden aleatorio** para evitar la memorización secuencial.
    3.  **Repetición:** Cada pronombre se pregunta un mínimo de **dos veces** a lo largo del ejercicio.
    4.  **Refuerzo de Errores:** Si el usuario comete un error en una forma, ese pronombre se **añade de nuevo al final de la cola de práctica**, asegurando que se vuelva a practicar antes de terminar la sesión.
    5.  **Ayuda Visual:** Durante la práctica, una tabla de referencia muestra todas las terminaciones, **resaltando la que corresponde al pronombre** que se está preguntando en ese momento.
    6.  **Secuencia:** Una vez completado el drill para el verbo `-ar`, el flujo se repite para el verbo modelo `-er` y finalmente para el verbo `-ir`.

### 4. Recapitulación

- **Componente Principal:** `NarrativeIntroduction.jsx`
- **Descripción:** Finalizado el drill de las tres terminaciones, se vuelve a mostrar la pantalla de presentación inicial a modo de repaso rápido, para que el usuario pueda volver a ver el cuadro completo de terminaciones antes de pasar a la práctica libre.

### 5. Práctica Mixta con Gamificación

- **Componente Principal:** `LearningDrill.jsx`
- **Descripción:** Es la etapa final del flujo. Aquí, el usuario pone a prueba lo aprendido en una sesión de práctica libre que combina:
    - **Mezcla de Verbos y Personas:** Se presentan verbos y pronombres de forma aleatoria de todo el conjunto seleccionado.
    - **Gamificación:** Se incluyen métricas como puntos, racha de aciertos y precisión para motivar al usuario.
    - **Consistencia de UX:** La interfaz y la interacción (incluyendo el uso de la tecla `Enter` para continuar) son consistentes con el resto de la aplicación.

## Componentes Involucrados

- **`LearnTenseFlow.jsx`**: Orquesta todo el flujo y gestiona el estado principal del módulo.
- **`NarrativeIntroduction.jsx`**: Muestra la presentación teórica y la recapitulación.
- **`EndingsDrill.jsx`**: El nuevo componente de práctica guiada, enfocado en terminaciones.
- **`LearningDrill.jsx`**: El componente final de práctica libre y gamificada.
