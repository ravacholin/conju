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
    title: 'Planes futuros',
    regularStory: {
      title: 'Planes para el futuro',
      sentences: {
          ar: 'Mañana yo __VERB__ con el equipo sobre el proyecto.',
          er: 'La semana próxima yo __VERB__ en el nuevo restaurante japonés.',
          ir: 'Yo __VERB__ en la casa nueva muy pronto.',
      },
      verbSpecific: {
          hablar: 'Mañana yo __VERB__ con el equipo sobre el proyecto.',
          comer: 'La semana próxima yo __VERB__ en el nuevo restaurante japonés.',
          vivir: 'Yo __VERB__ en la casa nueva muy pronto.',
      }
    },
    irregularStory: {
      title: 'Raíces irregulares del futuro',
      sentences: {
          ar: 'Raíz __ROOT__ + terminación → yo __VERB__ sin esfuerzo.',
          er: 'Raíz __ROOT__ + terminación → yo __VERB__ cuando haga falta.',
          ir: 'Raíz __ROOT__ + terminación → yo __VERB__ lo necesario.',
      },
      verbSpecific: {
          tener: 'Tener adopta la raíz tendr-: mañana yo __VERB__ el informe final.',
          poder: 'Poder usa podr-: desde ahora yo __VERB__ viajar cuando quiera.',
          decir: 'Decir pasa a dir-: en la reunión yo __VERB__ lo necesario sin rodeos.'
      },
    }
  },
  cond: {
    title: 'Situaciones hipotéticas',
    regularStory: {
      title: 'Si pudiera elegir...',
      sentences: {
          ar: 'En esa situación, yo __VERB__ con mi familia.',
          er: 'Con más tiempo, yo __VERB__ más despacio.',
          ir: 'Si tuviera oportunidad, yo __VERB__ en el campo.',
      },
      verbSpecific: {
          hablar: 'En esa situación, yo __VERB__ con toda honestidad.',
          comer: 'Con más tiempo libre, yo __VERB__ más despacio y relajado.',
          vivir: 'Si tuviera la oportunidad, yo __VERB__ tranquilamente en el campo.',
      }
    },
    irregularStory: {
      title: 'Raíces irregulares del condicional',
      sentences: {
          ar: 'Raíz __ROOT__ + terminación → yo __VERB__ si hiciera falta.',
          er: 'Raíz __ROOT__ + terminación → yo __VERB__ encantado.',
          ir: 'Raíz __ROOT__ + terminación → yo __VERB__ sin dudarlo.',
      },
      verbSpecific: {
          poner: 'Poner cambia a pondr-: con un día extra yo __VERB__ el plan en marcha.',
          querer: 'Querer toma querr-: en otra situación yo __VERB__ quedarme un poco más.',
          venir: 'Venir adopta vendr-: con mejor clima yo __VERB__ mañana sin dudarlo.'
      },
    }
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
    title: 'Acciones en progreso',
    regularStory: {
      title: 'Acciones continuas',
      sentences: {
          ar: 'Sigo __VERB__ con mi equipo cada día.',
          er: 'Estoy __VERB__ más despacio últimamente.',
          ir: 'Seguimos __VERB__ en la nueva casa.',
      },
      verbSpecific: {
          hablar: 'Sigo __VERB__ con mi equipo cada día.',
          comer: 'Estoy __VERB__ más despacio últimamente.',
          vivir: 'Seguimos __VERB__ tranquilamente en la nueva casa.',
      }
    },
    irregularStory: {
      title: 'Gerundios irregulares en acción',
      sentences: {
          ar: 'Forma clave: sigo __VERB__ cada mañana.',
          er: 'Forma clave: continúas __VERB__ sin detenerte.',
          ir: 'Forma clave: seguimos __VERB__ hasta terminar.',
      },
      verbSpecific: {
          ir: 'Ir → yendo: sigo __VERB__ al hospital cada semana.',
          decir: 'Decir → diciendo: continúas __VERB__ la verdad sin rodeos.',
          dormir: 'Dormir → durmiendo: seguimos __VERB__ profundamente pese al ruido.',
          poder: 'Poder → pudiendo: hoy estamos __VERB__ resolver más casos.',
          traer: 'Traer → trayendo: el equipo viene __VERB__ nuevas ideas.',
      },
    }
  },
  part: {
    title: 'Estados y resultados',
    regularStory: {
      title: 'Acciones completadas',
      sentences: {
          ar: 'El trabajo ya está __VERB__ para entregar.',
          er: 'La comida ha sido __VERB__ con cariño.',
          ir: 'Los documentos han sido __VERB__ correctamente.',
      },
      verbSpecific: {
          hablar: 'El tema ya ha sido __VERB__ en la reunión.',
          comer: 'La comida ha sido __VERB__ con mucho gusto.',
          vivir: 'Esos momentos han sido __VERB__ intensamente.',
      }
    },
    irregularStory: {
      title: 'Participios irregulares memorables',
      sentences: {
          ar: 'Resultado clave: el trabajo queda __VERB__ al final del día.',
          er: 'Resultado clave: los detalles permanecen __VERB__ hasta la revisión.',
          ir: 'Resultado clave: el informe sigue __VERB__ en la carpeta.',
      },
      verbSpecific: {
          hacer: 'Hacer → hecho: el proyecto queda __VERB__ y entregado.',
          ver: 'Ver → visto: dejamos todo __VERB__ antes de salir.',
          escribir: 'Escribir → escrito: el informe ya está __VERB__ y firmado.',
          poner: 'Poner → puesto: cada sensor queda __VERB__ en su lugar.',
          cubrir: 'Cubrir → cubierto: los materiales quedan __VERB__ para la lluvia.',
          resolver: 'Resolver → resuelto: los casos quedan __VERB__ antes de la reunión final.',
      },
    }
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
