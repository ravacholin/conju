/**
 * Narrative story data for learning module
 * Contains TEMPLATES for stories for each tense.
 * The __VERB__ placeholder will be dynamically replaced.
 */

export const storyData = {
  pres: {
    title: 'La rutina de Juan',
    sentences: {
        ar: 'Todos los días, Juan __VERB__ con sus amigos.',
        er: 'Siempre __VERB__ algo nuevo.',
        ir: 'Él __VERB__ en el centro de la ciudad.',
    },
    verbSpecific: {
        hablar: 'Todos los días, Juan __VERB__ con sus amigos.',
        aprender: 'Siempre __VERB__ algo nuevo.',
        vivir: 'Él __VERB__ en el centro de la ciudad.',
        cocinar: 'Ana __VERB__ todos los domingos para su familia.',
        beber: 'Ella __VERB__ café mientras prepara la comida.',
        abrir: 'Su hijo __VERB__ la ventana porque hace calor.',
        // Solicitud: la narrativa para "querer" debe ser "Todos los días, Juan quiere hacer cosas nuevas."
        querer: 'Todos los días, Juan __VERB__ hacer cosas nuevas.',
        pedir: 'Siempre __VERB__ consejo a su madre.',
        poder: 'Juan __VERB__ tocar la guitarra muy bien.',
    }
  },
  pretIndef: {
    title: 'Una tarde ocupada',
    sentences: {
        ar: 'Ayer, María __VERB__ por el parque.',
        er: 'Después, __VERB__ algo delicioso.',
        ir: 'Luego, __VERB__ en la biblioteca.',
    },
    verbSpecific: {
        caminar: 'Ayer, María __VERB__ por el parque.',
        comer: 'Luego, __VERB__ un helado de fresa.',
        escribir: 'Finalmente, __VERB__ una carta a su abuela.',
        vivir: 'Ayer, __VERB__ una experiencia inolvidable.',
        hablar: 'Esa tarde, __VERB__ con su mejor amigo.',
        aprender: 'En solo una tarde, __VERB__ a tejer.',
        // Irregulares en 3.ª persona: pedir, dormir, leer
        pedir: 'Primero __VERB__ un libro en la biblioteca.',
        dormir: 'Después __VERB__ un rato en la sala de lectura.',
        leer: 'Al final __VERB__ una novela muy interesante.',
    }
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: {
        ar: 'Cuando era niño, __VERB__ en el parque.',
        er: 'Mi madre siempre me __VERB__ un cuento.',
        ir: 'Nosotros __VERB__ en una casa pequeña.',
    },
    // Frases específicas para los tres irregulares del imperfecto
    // Solicitado: reemplazar la narrativa por estas tres oraciones
    verbSpecific: {
      ser: 'La casa __VERB__ muy pequeña.',
      // Usamos HTML para resaltar la forma en 1ª plural
      ir: 'Nosotros siempre <span class="highlight">íbamos</span> a la plaza.',
      ver: 'Desde la ventana yo __VERB__ las estrellas.',
      // Frases específicas para el flujo REGULAR (hablar, comer, vivir)
      hablar: 'De niño yo siempre __VERB__ con mis amigos en la plaza.',
      comer: 'Mi familia __VERB__ juntos los domingos.',
      // Para asegurar 1.ª plural, se fija la forma con highlight
      vivir: 'Nosotros <span class="highlight">vivíamos</span> en una casa pequeña.',
    },
  },
  fut: {
    title: 'Planes para el futuro',
    sentences: {
        ar: 'Mañana, __VERB__ con mi jefe.',
        er: 'Pronto __VERB__ mi tarea.',
        ir: 'Después __VERB__ con mis amigos.',
    },
  },
  cond: {
    title: 'Un mundo ideal',
    sentences: {
        ar: 'Si tuviera tiempo, __VERB__ con mi familia más.',
        er: 'Nosotros __VERB__ un viaje increíble.',
        ir: '¿Tú qué __VERB__ en esa situación?'
    },
  },
  subjPres: {
    title: 'Deseos y Recomendaciones',
    sentences: {
        ar: 'Espero que __VERB__ un buen día.',
        er: 'El doctor recomienda que __VERB__ más agua.',
        ir: 'Quiero que __VERB__ buenos amigos.',
    },
  },
  pretPerf: {
    title: 'Lo que hemos hecho hoy',
    sentences: {
        ar: 'Esta mañana he __VERB__ en un proyecto importante.',
        er: 'Mi hermana ya ha __VERB__ su desayuno.',
        ir: 'Nosotros hemos __VERB__ muchas experiencias juntos.',
    },
  },
  plusc: {
    title: 'Recuerdos del pasado',
    sentences: {
        ar: 'Cuando llegamos, él ya había __VERB__ con el director.',
        er: 'María había __VERB__ antes de ir al cine.',
        ir: 'Ellos habían __VERB__ allí durante muchos años.',
    },
  },
  futPerf: {
    title: 'Lo que habremos logrado',
    sentences: {
        ar: 'Para el viernes, habré __VERB__ todos mis proyectos.',
        er: 'En diciembre, tú habrás __VERB__ mucho español.',
        ir: 'Para entonces, nosotros habremos __VERB__ qué hacer.',
    },
  },
  subjImpf: {
    title: 'Si fuera posible...',
    sentences: {
        ar: 'Si __VERB__ más español, podría conseguir un mejor trabajo.',
        er: 'Ojalá __VERB__ más tiempo para estudiar.',
        ir: 'Si __VERB__ más amables, todo sería mejor.',
    },
  },
  condPerf: {
    title: 'Lo que habría pasado',
    sentences: {
        ar: 'Si hubiera tenido tiempo, habría __VERB__ más para el examen.',
        er: 'Con más dinero, habríamos __VERB__ por todo el mundo.',
        ir: 'Ellos habrían __VERB__ el proyecto si hubieran tenido ayuda.',
    },
  },
  subjPerf: {
    title: 'Espero que haya...',
    sentences: {
        ar: 'Espero que hayas __VERB__ para el examen de mañana.',
        er: 'Es posible que haya __VERB__ algo en mal estado.',
        ir: 'Dudo que hayan __VERB__ demasiado tarde.',
    },
  },
  subjPlusc: {
    title: 'Si hubiera sabido...',
    sentences: {
        ar: 'Si hubiera __VERB__ más, habría aprobado el examen.',
        er: 'Ojalá hubieras __VERB__ a la fiesta, te habría gustado mucho.',
        ir: 'Si hubieran __VERB__ antes, habrían visto el espectáculo.',
    },
  },
};
