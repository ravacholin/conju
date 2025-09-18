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
        poner: 'Yo __VERB__ música mientras trabajo.',
        hacer: 'Yo __VERB__ ejercicio por la tarde.',
        
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
        // Para -ir, usar una construcción natural para "vivir"
        ir: '__VERB__ en la ciudad nueva.',
    },
    verbSpecific: {
        // VERBOS REGULARES - Narrativa coherente de día de trabajo importante
        hablar: 'Ayer Laura __VERB__ con el director.',
        comer: '__VERB__ en el restaurante nuevo.',
        // Asegurar frase natural para VIVIR en pretérito indefinido
        vivir: '__VERB__ en la ciudad nueva.',
        escribir: '__VERB__ el informe final.',
        
        // MUY IRREGULARES DEL PRETÉRITO - Narrativa coherente de viaje especial
        estar: 'Ana __VERB__ en París la semana pasada.',
        hacer: '__VERB__ turismo por toda la ciudad.',
        querer: '__VERB__ ver todos los museos.',
        
        // IRREGULARES EN 3ª PERSONA - Narrativa coherente de rutina nocturna familiar
        pedir: 'El niño __VERB__ un cuento antes de dormir.',
        dormir: 'Él __VERB__ profundamente toda la noche.',
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
    title: 'Raíces irregulares del futuro',
    sentences: {
        ar: 'Con TENER → tendr-, Yo __ROOT__é la decisión final.',
        er: 'Con PODER → podr-, Tú __ROOT__ás trabajar desde casa.',
        ir: 'Con DECIR → dir-, Ella __ROOT__á lo necesario sin rodeos.',
    },
    verbSpecific: {
        tener: 'Con TENER → tendr-, Yo __ROOT__é la decisión final.',
        poder: 'Con PODER → podr-, Tú __ROOT__ás trabajar desde casa.',
        decir: 'Con DECIR → dir-, Ella __ROOT__á lo necesario sin rodeos.'
    },
  },
  cond: {
    title: 'Raíces irregulares del condicional',
    sentences: {
        ar: 'Con PONER → pondr-, Yo __ROOT__ía el plan en marcha si fuera necesario.',
        er: 'Con QUERER → querr-, Tú __ROOT__ías quedarte un poco más.',
        ir: 'Con VENIR → vendr-, Nosotros __ROOT__íamos mañana sin dudarlo.',
    },
    verbSpecific: {
        poner: 'Con PONER → pondr-, Yo __ROOT__ía el plan en marcha si fuera necesario.',
        querer: 'Con QUERER → querr-, Tú __ROOT__ías quedarte un poco más.',
        venir: 'Con VENIR → vendr-, Nosotros __ROOT__íamos mañana sin dudarlo.'
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
  ger: {
    title: 'Gerundios irregulares en acción',
    sentences: {
        ar: 'Con IR → yendo, repite: "Estoy __IRREG__ a la reunión urgente".',
        er: 'Con DECIR → diciendo, seguimos __IRREG__ la verdad en la retroalimentación.',
        ir: 'Con DORMIR → durmiendo, los niños siguen __IRREG__ profundamente.',
    },
    verbSpecific: {
        ir: 'Con IR → yendo, repite: "Estoy __IRREG__ a la reunión urgente".',
        decir: 'Con DECIR → diciendo, seguimos __IRREG__ la verdad en la retroalimentación.',
        dormir: 'Con DORMIR → durmiendo, los niños siguen __IRREG__ profundamente.',
    },
  },
  part: {
    title: 'Participios irregulares memorables',
    sentences: {
        ar: 'Con HACER → hecho, el proyecto queda __IRREG__ y entregado.',
        er: 'Con VER → visto, dejo todo __IRREG__ antes de salir.',
        ir: 'Con ESCRIBIR → escrito, el informe ya está __IRREG__ y firmado.',
    },
    verbSpecific: {
        hacer: 'Con HACER → hecho, el proyecto queda __IRREG__ y entregado.',
        ver: 'Con VER → visto, dejo todo __IRREG__ antes de salir.',
        escribir: 'Con ESCRIBIR → escrito, el informe ya está __IRREG__ y firmado.',
    },
  },
  impAff: {
    title: 'Consejos y recomendaciones',
    sentences: {
        ar: '¡__VERB__ con confianza!',
        er: '¡__VERB__ bien esta noche!',
        ir: '¡__VERB__ tu mejor vida!',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Consejos motivacionales
        hablar: '¡__VERB__ con seguridad en la presentación!',
        comer: '¡__VERB__ despacio y disfruta la comida!',
        vivir: '¡__VERB__ cada momento intensamente!',
        
        // Imperativos irregulares frecuentes
        hacer: '¡__VERB__ siempre tu mejor esfuerzo!',
        poner: '¡__VERB__ atención a los detalles!',
        salir: '¡__VERB__ y diviértete con tus amigos!',
        tener: '¡__VERB__ paciencia, todo mejorará!',
        venir: '¡__VERB__ a visitarnos pronto!',
        decir: '¡__VERB__ siempre la verdad!',
    },
  },
  impNeg: {
    title: 'Advertencias importantes',
    sentences: {
        ar: 'No __VERB__ sin pensarlo bien.',
        er: 'No __VERB__ si no tienes hambre.',
        ir: 'No __VERB__ con tanto estrés.',
    },
    verbSpecific: {
        // NARRATIVA COHERENTE - Advertencias de seguridad y bienestar
        hablar: 'No __VERB__ cuando estés muy enfadado.',
        comer: 'No __VERB__ tan rápido, es malo para la salud.',
        vivir: 'No __VERB__ con tanto estrés innecesario.',
        
        // Imperativos negativos irregulares
        hacer: 'No __VERB__ las cosas a última hora.',
        poner: 'No __VERB__ música muy alta por la noche.',
        salir: 'No __VERB__ sin abrigo, hace mucho frío.',
        tener: 'No __VERB__ miedo de intentar cosas nuevas.',
        venir: 'No __VERB__ si no te encuentras bien.',
        decir: 'No __VERB__ mentiras, siempre se descubren.',
    },
  },
};
