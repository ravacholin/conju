export const communicativeScenarios = {
  pres: {
    title: 'Rutina conectada',
    preTask: {
      context:
        'Conecta tu rutina diaria con los verbos que practicamos. Pensá en actividades reales y cómo se relacionan con tu contexto.',
      objectives: [
        'Activar vocabulario de hábitos en presente',
        'Integrar al menos dos verbos del listado practicado',
        'Preparar una respuesta fluida que conecte acciones y personas'
      ],
      activationQuestions: [
        '¿Qué acción repetís casi todos los días?',
        '¿Con quién compartís parte de tu rutina?'
      ],
    },
    conversationSteps: [
      {
        id: 'habits',
        prompt: 'Contame qué hacés en un día típico de semana.',
        goal: 'Describir la actividad principal usando verbos en 1ª persona del presente.',
        targetForms: [
          {
            match: { person: '1s' },
            focus: 'actividad central',
            fallbackForm: 'trabajo',
            acceptedPhrases: ['trabajo', 'laburo'],
          },
          {
            match: { person: '1s' },
            focus: 'actividad secundaria',
            fallbackForm: 'estudio',
            optional: true,
          },
        ],
        successResponse: '¡Genial! Ahora contame cómo te relajás o desconectás.',
        hint: 'Usá al menos dos verbos en presente (trabajo, estudio, salgo, como...).',
        supportPhrases: ['Normalmente...', 'Suelo...', 'Me levanto y...'],
      },
      {
        id: 'leisure',
        prompt: '¿Qué hacés para relajarte o disfrutar después?',
        goal: 'Incorporar hábitos de ocio en presente y conectar con emociones.',
        targetForms: [
          {
            match: { person: '1s' },
            focus: 'tiempo libre',
            fallbackForm: 'descanso',
            acceptedPhrases: ['descanso', 'relajo'],
            optional: true,
          },
          {
            match: { person: '1s' },
            focus: 'actividad social',
            fallbackForm: 'salgo',
            optional: true,
          },
        ],
        successResponse: 'Perfecto, describí con quién compartís esos momentos.',
        hint: 'Sumá otro verbo en presente para explicar tu tiempo libre.',
        supportPhrases: ['Cuando termino...', 'Después de trabajar...', 'Me gusta...'],
      },
      {
        id: 'people',
        prompt: '¿Con quién compartís parte de esas actividades?',
        goal: 'Practicar 1ª persona plural o 3ª persona para hablar de otras personas.',
        targetForms: [
          {
            match: { person: '1p' },
            focus: 'actividad compartida',
            fallbackForm: 'salimos',
            optional: true,
          },
          {
            match: { person: '3p' },
            focus: 'hábitos de otra persona',
            fallbackForm: 'trabajan',
            optional: true,
            allowReuse: true,
          },
        ],
        successResponse: 'Excelente. Con eso tenemos una imagen completa de tu rutina.',
        hint: 'Incluí otra persona verbal (salimos, compartimos, ellos vienen...).',
        supportPhrases: ['Con mi familia...', 'Mis amigos...', 'En casa solemos...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Qué verbos del listado usaste con mayor seguridad?',
        '¿Dónde podrías ampliar tu descripción para sonar más natural?',
      ],
      successCriteria: [
        'Incluiste al menos dos verbos del listado practicado.',
        'Conectaste tus acciones con otra persona o emoción.',
        'Usaste el tiempo verbal objetivo sin cambiar a otro tiempo.',
      ],
      consolidationTip: 'Escribí un párrafo breve con tres verbos clave y léelo en voz alta.',
    },
  },
  pretIndef: {
    title: 'Relato reciente',
    preTask: {
      context:
        'Traé a la memoria una experiencia concreta del fin de semana o de los últimos días.',
      objectives: [
        'Secuenciar acciones puntuales en pasado',
        'Recuperar verbos de alta frecuencia en pretérito indefinido',
        'Vincular acciones con personas o emociones'
      ],
      activationQuestions: [
        '¿Qué fue lo más interesante que hiciste el fin de semana?',
        '¿Qué acción marcó la diferencia?'
      ],
    },
    conversationSteps: [
      {
        id: 'event',
        prompt: '¿Qué hiciste el fin de semana pasado?',
        goal: 'Narrar la actividad principal con pretérito indefinido.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'fui',
            focus: 'acción principal',
            acceptedPhrases: ['fui', 'salí', 'visité'],
          },
          {
            match: { person: '1s' },
            fallbackForm: 'hice',
            optional: true,
          },
        ],
        successResponse: '¡Suena genial! Contame con quién lo compartiste.',
        hint: 'Usá verbos puntuales como fui, comí, visité, hice, compré...',
        supportPhrases: ['El sábado...', 'Primero...', 'Después...'],
      },
      {
        id: 'companions',
        prompt: '¿Con quién estuviste o qué persona fue importante?',
        goal: 'Practicar tercera persona en pretérito y conectar con relaciones.',
        targetForms: [
          {
            match: { person: '3s' },
            fallbackForm: 'vino',
            optional: true,
          },
          {
            match: { person: '1p' },
            fallbackForm: 'fuimos',
            optional: true,
          },
        ],
        successResponse: 'Gracias por compartirlo. Así cerramos la historia.',
        hint: 'Sumá otro verbo en pasado para describir a la otra persona.',
        supportPhrases: ['Mi amigo...', 'Con mi familia...', 'Nos encontramos y...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Qué conectores usaste para ordenar la historia?',
        '¿Hubo detalles que podrías ampliar?'
      ],
      successCriteria: [
        'Narraste al menos dos acciones en pretérito indefinido.',
        'Mencionaste a otra persona o reacción.',
      ],
      consolidationTip: 'Escribí la secuencia de acciones en tres frases ordenadas.',
    },
  },
  impf: {
    title: 'Recuerdos en contexto',
    preTask: {
      context: 'Pensá en una etapa de tu infancia o adolescencia y qué hacías habitualmente.',
      objectives: [
        'Describir hábitos y contextos en imperfecto',
        'Contrastar emociones o detalles de fondo',
        'Seleccionar vocabulario de memoria autobiográfica'
      ],
      activationQuestions: [
        '¿Cómo era un día típico en tu infancia?',
        '¿Qué cosas te encantaba hacer?'
      ],
    },
    conversationSteps: [
      {
        id: 'setting',
        prompt: '¿Cómo era tu vida cuando eras pequeño/a?',
        goal: 'Configurar el escenario con verbos en imperfecto.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'vivía',
            focus: 'contexto general',
            acceptedPhrases: ['vivía', 'estaba'],
          },
          {
            match: { person: '1s' },
            fallbackForm: 'tenía',
            optional: true,
          },
        ],
        successResponse: 'Qué lindo recuerdo. Contame una actividad que repetías.',
        hint: 'Usá el imperfecto para describir escenarios (vivía, tenía, era, jugaba...).',
        supportPhrases: ['Cuando era chico...', 'En mi casa...', 'Siempre...'],
      },
      {
        id: 'activities',
        prompt: '¿Qué actividades repetías o disfrutabas?',
        goal: 'Enumerar acciones habituales y sentimientos en imperfecto.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'jugaba',
            optional: true,
          },
          {
            match: { person: '1s' },
            fallbackForm: 'leía',
            optional: true,
          },
        ],
        successResponse: 'Excelente. Esa imagen queda clara.',
        hint: 'Agregá otra acción en imperfecto para dar más color.',
        supportPhrases: ['Soleía...', 'Me encantaba...', 'Todos los días...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Lograste sostener el imperfecto sin cambiar a otro tiempo?',
        '¿Qué detalles sensoriales podrías sumar la próxima vez?'
      ],
      successCriteria: [
        'Usaste al menos dos verbos en imperfecto relacionados.',
        'Conectaste la acción con emociones o escenarios.',
      ],
      consolidationTip: 'Grabá una nota de voz con la misma historia para escuchar tu fluidez.',
    },
  },
  fut: {
    title: 'Proyecciones personales',
    preTask: {
      context: 'Imaginá tus planes para el próximo año y qué metas querés alcanzar.',
      objectives: [
        'Expresar planes y metas en futuro simple',
        'Relacionar verbos con objetivos concretos',
        'Practicar conectores de proyección'
      ],
      activationQuestions: [
        '¿Qué meta te entusiasma para el año que viene?',
        '¿Qué pasos seguirás para lograrla?'
      ],
    },
    conversationSteps: [
      {
        id: 'goal',
        prompt: '¿Qué harás el próximo año para cumplir una meta importante?',
        goal: 'Describir metas en futuro simple con claridad.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'estudiaré',
            focus: 'objetivo principal',
          },
          {
            match: { person: '1s' },
            fallbackForm: 'viajaré',
            optional: true,
          },
        ],
        successResponse: 'Muy bien. ¿Cómo te vas a preparar?',
        hint: 'Usá verbos como estudiaré, trabajaré, viajaré, ahorraré.',
        supportPhrases: ['El año que viene...', 'Tengo pensado...', 'Voy a...'],
      },
      {
        id: 'plan',
        prompt: '¿Qué pasos seguirás para hacerlo posible?',
        goal: 'Incluir detalles de planificación en futuro.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'ahorraré',
            optional: true,
          },
          {
            match: { person: '1s' },
            fallbackForm: 'practicaré',
            optional: true,
          },
        ],
        successResponse: 'Excelente proyección. Me encanta tu plan.',
        hint: 'Sumá otro verbo en futuro para detallar el proceso.',
        supportPhrases: ['Para lograrlo...', 'Cada mes...', 'Además...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Qué tan realistas fueron tus verbos y planes?',
        '¿Qué otra meta podrías describir en futuro?'
      ],
      successCriteria: [
        'Presentaste una meta y un paso concreto en futuro.',
        'Mantuviste coherencia temporal durante la respuesta.',
      ],
      consolidationTip: 'Escribí tus metas en una lista y léelas en voz alta cada semana.',
    },
  },
  pretPerf: {
    title: 'Logros recientes',
    preTask: {
      context: 'Pensá en algo que hayas hecho esta semana y que quieras compartir.',
      objectives: [
        'Conectar experiencias recientes con pretérito perfecto',
        'Usar expresiones temporales como "ya", "todavía"',
        'Reflexionar sobre resultados inmediatos'
      ],
      activationQuestions: [
        '¿Qué actividad terminaste recientemente?',
        '¿Qué sensación te dejó?'
      ],
    },
    conversationSteps: [
      {
        id: 'achievement',
        prompt: '¿Qué has hecho esta semana que te haga sentir orgulloso/a?',
        goal: 'Describir logros con pretérito perfecto compuesto.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'he terminado',
            focus: 'logro principal',
          },
          {
            match: { person: '1s' },
            fallbackForm: 'he aprendido',
            optional: true,
          },
        ],
        successResponse: '¡Excelente! ¿Qué impacto ha tenido?',
        hint: 'Usá la estructura he + participio (he terminado, he estudiado...).',
        supportPhrases: ['Esta semana he...', 'Últimamente he...', 'Todavía no he...'],
      },
      {
        id: 'impact',
        prompt: '¿Cómo te ha cambiado o qué ha significado para vos?',
        goal: 'Relacionar el logro con consecuencias actuales.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'he mejorado',
            optional: true,
          },
          {
            match: { person: '1p' },
            fallbackForm: 'hemos celebrado',
            optional: true,
          },
        ],
        successResponse: 'Gracias por compartirlo. Cerramos la conversación.',
        hint: 'Añadí otra oración con pretérito perfecto para conectar ideas.',
        supportPhrases: ['Desde entonces he...', 'Gracias a eso he...', 'Nos hemos sentido...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Usaste marcadores temporales como "ya" o "todavía"?',
        '¿Podrías resumir el impacto en una frase más?'
      ],
      successCriteria: [
        'Incluiste al menos un logro en pretérito perfecto.',
        'Relacionaste el logro con una consecuencia actual.',
      ],
      consolidationTip: 'Anotá tus logros de la semana en un diario para revisarlos.',
    },
  },
  cond: {
    title: 'Mundos hipotéticos',
    preTask: {
      context: 'Imaginá situaciones hipotéticas y cómo reaccionarías.',
      objectives: [
        'Expresar deseos o planes condicionados',
        'Practicar el condicional simple con verbos de alta frecuencia',
        'Explorar consecuencias y motivos'
      ],
      activationQuestions: [
        'Si tuvieras un día libre extra, ¿qué harías?',
        '¿Qué sueño cambiarías por completo tu vida?'
      ],
    },
    conversationSteps: [
      {
        id: 'wish',
        prompt: 'Si tuvieras recursos infinitos, ¿qué harías primero?',
        goal: 'Formular deseos en condicional simple.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'viajaría',
            focus: 'deseo principal',
          },
          {
            match: { person: '1s' },
            fallbackForm: 'ayudaría',
            optional: true,
          },
        ],
        successResponse: 'Interesante. ¿Qué impacto tendría?',
        hint: 'Usá condicionales como viajaría, cambiaría, estudiaría, ayudaría.',
        supportPhrases: ['Si pudiera...', 'Me gustaría...', 'Sería genial si...'],
      },
      {
        id: 'impact',
        prompt: '¿Cómo cambiaría tu entorno o tu vida?',
        goal: 'Explorar consecuencias en condicional.',
        targetForms: [
          {
            match: { person: '3p' },
            fallbackForm: 'estarían',
            optional: true,
          },
          {
            match: { person: '1p' },
            fallbackForm: 'seríamos',
            optional: true,
          },
        ],
        successResponse: 'Gracias por imaginar conmigo.',
        hint: 'Sumá al menos una consecuencia usando condicional.',
        supportPhrases: ['La gente...', 'Mis amigos...', 'Nosotros...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Qué tan claras quedaron las condiciones?',
        '¿Podrías agregar un motivo que justifique tu elección?'
      ],
      successCriteria: [
        'Planteaste un deseo con condicional simple.',
        'Mencionaste una consecuencia o impacto.',
      ],
      consolidationTip: 'Escribí tres frases con "Si + imperfecto" y sus respuestas en condicional.',
    },
  },
  plusc: {
    title: 'Antes de que sucediera',
    preTask: {
      context: 'Recordá una situación donde algo ya había ocurrido cuando llegaste.',
      objectives: [
        'Narrar antecedentes con pluscuamperfecto',
        'Practicar conectores temporales (cuando, antes de)',
        'Relacionar acciones pasadas con reacciones'
      ],
      activationQuestions: [
        '¿Qué cosa había pasado cuando llegaste a un lugar?',
        '¿Cómo reaccionaste al enterarte?'
      ],
    },
    conversationSteps: [
      {
        id: 'background',
        prompt: 'Contame un momento en el que llegaste tarde y algo ya había ocurrido.',
        goal: 'Describir antecedentes usando pluscuamperfecto.',
        targetForms: [
          {
            match: { person: '3p' },
            fallbackForm: 'habían salido',
            focus: 'acción que ya había pasado',
          },
          {
            match: { person: '1s' },
            fallbackForm: 'había llegado',
            optional: true,
          },
        ],
        successResponse: 'Qué situación. ¿Qué hiciste después?',
        hint: 'Usá había + participio (había llegado, habían empezado...).',
        supportPhrases: ['Cuando llegué...', 'Antes de que yo...', 'Ya habían...'],
      },
      {
        id: 'reaction',
        prompt: '¿Qué hiciste o cómo reaccionaste después de darte cuenta?',
        goal: 'Continuar con acciones posteriores.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'me quedé',
            optional: true,
          },
          {
            match: { person: '1s' },
            fallbackForm: 'llamé',
            optional: true,
          },
        ],
        successResponse: 'Gracias por compartirlo. Cerramos la escena.',
        hint: 'Podés combinar pluscuamperfecto con pretérito para explicar la reacción.',
        supportPhrases: ['Entonces...', 'Después...', 'Decidí...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Se entendió el orden temporal de los eventos?',
        '¿Qué detalles podrías agregar la próxima vez?'
      ],
      successCriteria: [
        'Explicaste claramente qué había sucedido antes de tu llegada.',
        'Añadiste una reacción posterior.',
      ],
      consolidationTip: 'Dibuja una línea temporal con los eventos para visualizar la secuencia.',
    },
  },
  futPerf: {
    title: 'Metas cumplidas en el futuro',
    preTask: {
      context: 'Imaginá tu vida dentro de unos años y qué cosas ya habrás completado.',
      objectives: [
        'Proyectar logros con futuro perfecto',
        'Relacionar metas con plazos concretos',
        'Practicar expresiones temporales (para entonces, dentro de)'
      ],
      activationQuestions: [
        'Dentro de cinco años, ¿qué cosas ya habrás logrado?',
        '¿Qué proyecto te gustaría haber terminado?'
      ],
    },
    conversationSteps: [
      {
        id: 'projection',
        prompt: 'Dentro de cinco años, ¿qué cosas ya habrás conseguido?',
        goal: 'Expresar logros futuros completados.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'habré terminado',
            focus: 'logro principal',
          },
          {
            match: { person: '1s' },
            fallbackForm: 'habré aprendido',
            optional: true,
          },
        ],
        successResponse: 'Suena inspirador. ¿Qué vendrá después?',
        hint: 'Usá habré + participio (habré terminado, habré viajado...).',
        supportPhrases: ['Para entonces...', 'Cuando tenga...', 'Ya habré...'],
      },
      {
        id: 'nextSteps',
        prompt: '¿Qué harás después de lograrlo?',
        goal: 'Conectar futuro perfecto con futuro simple o condicional.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'seguiré',
            optional: true,
          },
          {
            match: { person: '1p' },
            fallbackForm: 'habremos compartido',
            optional: true,
          },
        ],
        successResponse: '¡Gran plan! Cerramos la proyección.',
        hint: 'Añadí una acción posterior usando futuro o condicional.',
        supportPhrases: ['Después de eso...', 'Entonces...', 'Más tarde...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Tus objetivos tienen un plazo concreto?',
        '¿Qué paso podrías dar hoy para acercarte a esa meta?'
      ],
      successCriteria: [
        'Expresaste al menos un logro en futuro perfecto.',
        'Conectaste el logro con una acción posterior.',
      ],
      consolidationTip: 'Escribí tus metas en formato "Para [fecha] habré..." y revísalas mensualmente.',
    },
  },
  subjPres: {
    title: 'Organizando juntos',
    preTask: {
      context: 'Pensá en una actividad grupal y qué necesitas que otras personas hagan.',
      objectives: [
        'Expresar pedidos y recomendaciones con subjuntivo presente',
        'Conectar con expresiones de influencia y deseo',
        'Practicar estructuras como "quiero que", "es importante que"'
      ],
      activationQuestions: [
        '¿Qué evento estás organizando?',
        '¿Qué necesitas que haga tu equipo?'
      ],
    },
    conversationSteps: [
      {
        id: 'requests',
        prompt: 'Estoy organizando una actividad. ¿Qué te gustaría que hagan tus amigos?',
        goal: 'Formular peticiones con subjuntivo presente.',
        targetForms: [
          {
            match: { person: '3p' },
            fallbackForm: 'vengan',
            focus: 'petición principal',
          },
          {
            match: { person: '2s' },
            fallbackForm: 'traigas',
            optional: true,
          },
        ],
        successResponse: 'Perfecto. ¿Qué otra cosa es importante?',
        hint: 'Usá expresiones como quiero que, es necesario que, ojalá que + subjuntivo.',
        supportPhrases: ['Quiero que...', 'Es importante que...', 'Prefiero que...'],
      },
      {
        id: 'coordination',
        prompt: '¿Qué condiciones tienen que cumplirse para que todo salga bien?',
        goal: 'Dar recomendaciones y condiciones con subjuntivo.',
        targetForms: [
          {
            match: { person: '1p' },
            fallbackForm: 'preparemos',
            optional: true,
          },
          {
            match: { person: '3p' },
            fallbackForm: 'traigan',
            optional: true,
            allowReuse: true,
          },
        ],
        successResponse: 'Excelente. Tu plan suena sólido.',
        hint: 'Sumá otro verbo en subjuntivo para reforzar la idea.',
        supportPhrases: ['Necesito que...', 'Es mejor que...', 'Espero que...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Usaste expresiones de influencia correctas?',
        '¿Podrías variar los conectores la próxima vez?'
      ],
      successCriteria: [
        'Formulaste al menos una petición con subjuntivo presente.',
        'Incluiste razones o condiciones.',
      ],
      consolidationTip: 'Haz una lista de frases con "Quiero que..." y completa con distintos verbos.',
    },
  },
  subjImpf: {
    title: 'Escenarios alternativos',
    preTask: {
      context: 'Imaginá situaciones hipotéticas en el pasado y qué habría pasado si algo fuera diferente.',
      objectives: [
        'Practicar el subjuntivo imperfecto en oraciones condicionales',
        'Conectar con condicional simple y expresiones de deseo',
        'Explorar arrepentimientos o deseos no cumplidos'
      ],
      activationQuestions: [
        'Si pudieras volver a una situación, ¿qué cambiarías?',
        '¿Qué consejo le darías a tu yo del pasado?'
      ],
    },
    conversationSteps: [
      {
        id: 'hypothesis',
        prompt: 'Si volvieras a una situación importante, ¿qué harías diferente?',
        goal: 'Usar estructuras condicionales con subjuntivo imperfecto.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'hiciera',
            focus: 'acción alternativa',
          },
          {
            match: { person: '1s' },
            fallbackForm: 'estudiara',
            optional: true,
          },
        ],
        successResponse: 'Interesante. ¿Qué habría pasado como resultado?',
        hint: 'Usá si + subjuntivo imperfecto (si tuviera, si pudiera, si estudiara...).',
        supportPhrases: ['Si pudiera...', 'Si tuviera...', 'Si supiera...'],
      },
      {
        id: 'result',
        prompt: '¿Qué habría pasado si esa acción hubiera sido distinta?',
        goal: 'Describir consecuencias hipotéticas.',
        targetForms: [
          {
            match: { person: '3p' },
            fallbackForm: 'estarían',
            optional: true,
          },
          {
            match: { person: '1p' },
            fallbackForm: 'seríamos',
            optional: true,
          },
        ],
        successResponse: 'Gracias por compartir esa reflexión.',
        hint: 'Conectá con condicional simple para mostrar el resultado.',
        supportPhrases: ['Entonces...', 'Probablemente...', 'Eso haría que...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Combinaste correctamente subjuntivo imperfecto con condicional?',
        '¿Podrías dar un ejemplo adicional?'
      ],
      successCriteria: [
        'Formulaste al menos una hipótesis completa.',
        'Conectaste causa y consecuencia.',
      ],
      consolidationTip: 'Escribí tres oraciones tipo "Si + subjuntivo imperfecto, condicional" y léelas en voz alta.',
    },
  },
  subjPerf: {
    title: 'Esperanzas recientes',
    preTask: {
      context: 'Pensá en situaciones recientes donde esperabas que algo ya hubiera ocurrido.',
      objectives: [
        'Usar el perfecto de subjuntivo para expresar duda o emoción',
        'Relacionar eventos recientes con expectativas',
        'Practicar expresiones como "me alegra que", "espero que"'
      ],
      activationQuestions: [
        '¿Qué noticia esperabas recibir esta semana?',
        '¿Qué emoción sentiste al saber el resultado?'
      ],
    },
    conversationSteps: [
      {
        id: 'expectation',
        prompt: 'Estoy esperando noticias. ¿Qué esperás que haya pasado?',
        goal: 'Expresar deseos con perfecto de subjuntivo.',
        targetForms: [
          {
            match: { person: '3s' },
            fallbackForm: 'haya llegado',
            focus: 'resultado esperado',
          },
          {
            match: { person: '3p' },
            fallbackForm: 'hayan respondido',
            optional: true,
          },
        ],
        successResponse: 'Ojalá que sí. ¿Y si no fue así?',
        hint: 'Usá haya + participio (haya llegado, hayan respondido...).',
        supportPhrases: ['Espero que...', 'Me alegra que...', 'Dudo que...'],
      },
      {
        id: 'backupPlan',
        prompt: 'Si las cosas no han salido como esperabas, ¿qué harías?',
        goal: 'Planificar respuesta combinando subjuntivo perfecto y condicional.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'habría llamado',
            optional: true,
          },
          {
            match: { person: '1s' },
            fallbackForm: 'habría buscado',
            optional: true,
          },
        ],
        successResponse: 'Gran plan alternativo. Cerramos la conversación.',
        hint: 'Podés mezclar con condicional para mostrar tu reacción.',
        supportPhrases: ['En caso de que...', 'Si no...', 'Entonces...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Qué emoción transmitiste con el perfecto de subjuntivo?',
        '¿Cómo podrías intensificar esa emoción?'
      ],
      successCriteria: [
        'Incluiste al menos una esperanza en perfecto de subjuntivo.',
        'Conectaste con un plan alternativo.',
      ],
      consolidationTip: 'Anotá tres frases con "Espero que" + haya + participio.',
    },
  },
  subjPlusc: {
    title: 'Deseos imposibles',
    preTask: {
      context: 'Recordá un momento en el que deseabas que algo hubiera sido distinto.',
      objectives: [
        'Expresar lamentos con pluscuamperfecto de subjuntivo',
        'Conectar con condicional compuesto',
        'Explorar sentimientos de arrepentimiento'
      ],
      activationQuestions: [
        '¿Qué cosa te hubiese gustado cambiar en una situación pasada?',
        '¿Qué aprendizaje sacaste de eso?'
      ],
    },
    conversationSteps: [
      {
        id: 'regret',
        prompt: 'Pienso en algo que no salió bien. ¿Qué ojalá que hubiera pasado?',
        goal: 'Formular deseos imposibles con subjuntivo pluscuamperfecto.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'hubiera estudiado',
            focus: 'acción no realizada',
          },
          {
            match: { person: '3p' },
            fallbackForm: 'hubieran venido',
            optional: true,
          },
        ],
        successResponse: 'Lo entiendo. ¿Qué habrías hecho diferente después?',
        hint: 'Usá hubiera/hubiese + participio (hubiera estudiado, hubieran llegado).',
        supportPhrases: ['Ojalá que...', 'Si al menos...', 'Me habría gustado que...'],
      },
      {
        id: 'lesson',
        prompt: '¿Qué harías si se repitiera la situación?',
        goal: 'Conectar el arrepentimiento con un plan futuro.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'estudiaría',
            optional: true,
          },
          {
            match: { person: '1s' },
            fallbackForm: 'habría hablado',
            optional: true,
          },
        ],
        successResponse: 'Gran reflexión. Lo importante es aprender.',
        hint: 'Podés pasar del subjuntivo pluscuamperfecto al condicional para mostrar aprendizaje.',
        supportPhrases: ['La próxima vez...', 'Ahora sé que...', 'Aprendí que...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Qué emoción dominante transmitiste?',
        '¿Cómo podrías cerrar con un mensaje positivo?'
      ],
      successCriteria: [
        'Expresaste un deseo imposible usando subjuntivo pluscuamperfecto.',
        'Ofreciste una alternativa futura.',
      ],
      consolidationTip: 'Escribí dos frases con "Ojalá que" + hubiera/hubiese + participio.',
    },
  },
  condPerf: {
    title: 'Lecciones aprendidas',
    preTask: {
      context: 'Pensá en cómo habrías actuado de otra manera con lo que sabés hoy.',
      objectives: [
        'Usar el condicional compuesto para hablar de alternativas pasadas',
        'Conectar con aprendizajes presentes',
        'Practicar expresiones como "si hubiera", "habría"'
      ],
      activationQuestions: [
        'Si hubieras tenido más información, ¿qué habrías hecho?',
        '¿Qué decisión te habría gustado cambiar?'
      ],
    },
    conversationSteps: [
      {
        id: 'alternative',
        prompt: 'Si hubieras tenido más tiempo, ¿qué habrías hecho diferente?',
        goal: 'Expresar acciones alternativas con condicional compuesto.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'habría estudiado',
            focus: 'acción alternativa',
          },
          {
            match: { person: '1s' },
            fallbackForm: 'habría viajado',
            optional: true,
          },
        ],
        successResponse: 'Entiendo. ¿Qué aprendizaje te deja?',
        hint: 'Usá habría + participio (habría tomado, habría dicho, habría ido).',
        supportPhrases: ['Si hubiera...', 'Con más tiempo habría...', 'En ese caso habría...'],
      },
      {
        id: 'learning',
        prompt: '¿Qué harías ahora si una situación parecida se repite?',
        goal: 'Conectar condicional compuesto con planes futuros.',
        targetForms: [
          {
            match: { person: '1s' },
            fallbackForm: 'aprendería',
            optional: true,
          },
          {
            match: { person: '1s' },
            fallbackForm: 'buscaría',
            optional: true,
          },
        ],
        successResponse: 'Gracias por compartir tu aprendizaje.',
        hint: 'Cerrá con un plan concreto para el futuro.',
        supportPhrases: ['La próxima vez...', 'Ahora sé que...', 'Voy a...'],
      },
    ],
    postTask: {
      prompts: [
        '¿Expresaste claramente la alternativa pasada?',
        '¿Sumaste un aprendizaje concreto?'
      ],
      successCriteria: [
        'Usaste condicional compuesto para describir la alternativa.',
        'Conectaste con un plan o aprendizaje actual.',
      ],
      consolidationTip: 'Escribí un breve diario de decisiones con "Si hubiera..., habría...".',
    },
  },
};
