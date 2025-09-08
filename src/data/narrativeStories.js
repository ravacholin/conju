/**
 * Narrative story data for learning module
 * Contains TEMPLATES for stories for each tense.
 * The __VERB__ placeholder will be dynamically replaced.
 */

export const storyData = {
  pres: {
    title: 'Rutinas de trabajo',
    sentences: {
        ar: 'Juan __VERB__ por teléfono cada mañana.',
        er: '__VERB__ con su equipo a las 2.',
        ir: '__VERB__ cerca de la oficina.',
    },
    verbSpecific: {
        // VERBOS REGULARES - Narrativa coherente de rutina laboral
        hablar: 'Juan __VERB__ por teléfono cada mañana.',
        comer: '__VERB__ con su equipo a las 2.',
        vivir: '__VERB__ cerca de la oficina.',
        
        // IRREGULARES EN YO - Narrativa coherente de rutina personal
        salir: 'Yo __VERB__ de casa a las 8.',
        poner: '__VERB__ música mientras trabajo.',
        hacer: '__VERB__ ejercicio por la tarde.',
        
        // DIPTONGOS - Narrativa coherente de flexibilidad laboral
        poder: 'María __VERB__ trabajar desde casa.',
        querer: '__VERB__ cambiar de proyecto.',
        pedir: '__VERB__ ayuda cuando la necesita.',
        
        // MUY IRREGULARES - Narrativa coherente de descripción personal/profesional
        ser: 'Carlos __VERB__ programador.',
        estar: '__VERB__ en una reunión.',
        ir: '__VERB__ al trabajo en metro.',
    }
  },
  pretIndef: {
    title: 'Un día especial',
    sentences: {
        ar: 'Ayer Laura __VERB__ con el director.',
        er: '__VERB__ en el restaurante nuevo.',
        ir: '__VERB__ el informe final.',
    },
    verbSpecific: {
        // VERBOS REGULARES - Narrativa coherente de día de trabajo importante
        hablar: 'Ayer Laura __VERB__ con el director.',
        comer: '__VERB__ en el restaurante nuevo.',
        escribir: '__VERB__ el informe final.',
        
        // MUY IRREGULARES DEL PRETÉRITO - Narrativa coherente de viaje especial
        estar: 'Ana __VERB__ en París la semana pasada.',
        hacer: '__VERB__ turismo por toda la ciudad.',
        querer: '__VERB__ ver todos los museos.',
        
        // IRREGULARES EN 3ª PERSONA - Narrativa coherente de rutina nocturna familiar
        pedir: 'El niño __VERB__ un cuento antes de dormir.',
        dormir: '__VERB__ profundamente toda la noche.',
        leer: 'Su madre __VERB__ hasta muy tarde.',
    }
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: {
        ar: 'De niño, Pedro __VERB__ con timidez.',
        er: '__VERB__ muy despacio.',
        ir: '__VERB__ con sus abuelos en el campo.',
    },
    verbSpecific: {
        // VERBOS REGULARES - Narrativa coherente de recuerdos de la infancia
        hablar: 'De niño, Pedro __VERB__ con timidez.',
        comer: '__VERB__ muy despacio.',
        vivir: '__VERB__ con sus abuelos en el campo.',
        
        // IRREGULARES DEL IMPERFECTO - Narrativa coherente de la casa familiar
        ser: 'La casa familiar __VERB__ muy acogedora.',
        ir: 'Toda la familia __VERB__ al mercado los sábados.',
        ver: 'Desde la ventana __VERB__ pasar los trenes.',
    },
  },
  fut: {
    title: 'Planes para mañana',
    sentences: {
        ar: 'Mañana __VERB__ con la directora.',
        er: '__VERB__ en el café de siempre.',
        ir: '__VERB__ a la nueva oficina.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Reunión importante de trabajo
        hablar: 'Mañana __VERB__ con la directora.',
        comer: '__VERB__ en el café de siempre.',
        vivir: '__VERB__ una experiencia única.',
    },
  },
  cond: {
    title: 'Situaciones hipotéticas',
    sentences: {
        ar: 'En esa situación, __VERB__ con mucha calma.',
        er: '__VERB__ mucho menos.',
        ir: '__VERB__ de manera diferente.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Reflexión sobre comportamiento en crisis
        hablar: 'En esa situación, __VERB__ con mucha calma.',
        comer: '__VERB__ mucho menos por los nervios.',
        vivir: '__VERB__ de manera completamente diferente.',
    },
  },
  subjPres: {
    title: 'Buenos deseos',
    sentences: {
        ar: 'Espero que __VERB__ con claridad.',
        er: 'Ojalá __VERB__ bien esta noche.',
        ir: 'Deseo que __VERB__ muy feliz.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Deseos para alguien querido
        hablar: 'Espero que __VERB__ con claridad en la presentación.',
        comer: 'Ojalá __VERB__ bien esta noche en casa.',
        vivir: 'Deseo que __VERB__ muy feliz en tu nueva ciudad.',
    },
  },
  pretPerf: {
    title: 'Logros del día',
    sentences: {
        ar: 'Hoy he __VERB__ mucho con mi equipo.',
        er: 'Ya he __VERB__ tres veces.',
        ir: 'He __VERB__ momentos increíbles.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Día productivo
        hablar: 'Hoy he __VERB__ mucho con mi equipo.',
        comer: 'Ya he __VERB__ tres veces por el estrés.',
        vivir: 'He __VERB__ momentos increíbles este año.',
    },
  },
  plusc: {
    title: 'Lo que había pasado antes',
    sentences: {
        ar: 'Cuando llegué, ya había __VERB__ con todos.',
        er: 'Ana había __VERB__ temprano.',
        ir: 'Nosotros habíamos __VERB__ allí antes.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Secuencia temporal
        hablar: 'Cuando llegué a la oficina, ya había __VERB__ con todos los clientes.',
        comer: 'Ana había __VERB__ muy temprano esa mañana.',
        vivir: 'Nosotros habíamos __VERB__ en esa casa durante años.',
    },
  },
  futPerf: {
    title: 'Metas futuras',
    sentences: {
        ar: 'Para diciembre, habré __VERB__ con todos los socios.',
        er: 'Habrás __VERB__ en los mejores restaurantes.',
        ir: 'Habremos __VERB__ aventuras increíbles.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Proyección de logros
        hablar: 'Para diciembre, habré __VERB__ con todos los inversores.',
        comer: 'Habrás __VERB__ en los mejores restaurantes de la ciudad.',
        vivir: 'Habremos __VERB__ aventuras increíbles juntos.',
    },
  },
  subjImpf: {
    title: 'Si las cosas fueran diferentes...',
    sentences: {
        ar: 'Si __VERB__ con más frecuencia, nos entenderíamos mejor.',
        er: 'Ojalá __VERB__ más despacio.',
        ir: 'Si __VERB__ en el campo, sería más tranquilo.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Reflexiones sobre una relación
        hablar: 'Si __VERB__ con más frecuencia, nos entenderíamos mejor.',
        comer: 'Ojalá __VERB__ más despacio y sin prisa.',
        vivir: 'Si __VERB__ en el campo, todo sería más tranquilo.',
    },
  },
  condPerf: {
    title: 'Lo que podría haber sido',
    sentences: {
        ar: 'Con más tiempo, habría __VERB__ mejor.',
        er: 'Habríamos __VERB__ mucho más.',
        ir: 'Habrían __VERB__ mejor sin tanto estrés.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Arrepentimiento sobre decisiones pasadas
        hablar: 'Con más confianza, habría __VERB__ mejor en la entrevista.',
        comer: 'En vacaciones, habríamos __VERB__ mucho más variado.',
        vivir: 'Sin tantas preocupaciones, habrían __VERB__ mucho mejor.',
    },
  },
  subjPerf: {
    title: 'Dudas sobre el presente',
    sentences: {
        ar: 'Espero que haya __VERB__ con claridad.',
        er: 'Es posible que haya __VERB__ demasiado.',
        ir: 'Dudo que hayan __VERB__ cómodamente.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Preocupación por un ser querido
        hablar: 'Espero que haya __VERB__ con el jefe sobre el problema.',
        comer: 'Me preocupa que haya __VERB__ demasiado en la cena.',
        vivir: 'Dudo que hayan __VERB__ cómodamente en ese apartamento.',
    },
  },
  subjPlusc: {
    title: 'Lamentos del pasado',
    sentences: {
        ar: 'Si hubiera __VERB__ antes, todo habría sido diferente.',
        er: 'Ojalá hubiera __VERB__ más en casa.',
        ir: 'Si hubieran __VERB__ allí, habrían sido felices.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Reflexión sobre oportunidades perdidas
        hablar: 'Si hubiera __VERB__ con ella antes, todo habría sido diferente.',
        comer: 'Ojalá hubiera __VERB__ más en casa con la familia.',
        vivir: 'Si hubieran __VERB__ en el campo, habrían sido mucho más felices.',
    },
  },
};
