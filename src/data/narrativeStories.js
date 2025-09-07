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
    }
  },
  pretIndef: {
    title: 'Una tarde ocupada',
    sentences: {
        ar: 'Ayer, María __VERB__ por el parque.',
        er: 'Luego, __VERB__ un helado de fresa.',
        ir: 'Finalmente, __VERB__ una carta a su abuela.',
    },
    verbSpecific: {
        caminar: 'Ayer, María __VERB__ por el parque.',
        comer: 'Luego, __VERB__ un helado de fresa.',
        escribir: 'Finalmente, __VERB__ una carta a su abuela.',
        vivir: 'Durante años, __VERB__ en esa casa.',
    }
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: {
        ar: 'Cuando era niño, __VERB__ en el parque.',
        er: 'Mi madre siempre me __VERB__ un cuento.',
        ir: 'Nosotros __VERB__ en una casa pequeña.',
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
        ar: 'Esta mañana __VERB__ en un proyecto importante.',
        er: 'Mi hermana __VERB__ ya su desayuno.',
        ir: 'Nosotros __VERB__ muchas experiencias juntos.',
    },
  },
  plusc: {
    title: 'Recuerdos del pasado',
    sentences: {
        ar: 'Cuando llegamos, él ya __VERB__ con el director.',
        er: 'María __VERB__ antes de ir al cine.',
        ir: 'Ellos __VERB__ allí durante muchos años.',
    },
  },
  futPerf: {
    title: 'Lo que habremos logrado',
    sentences: {
        ar: 'Para el viernes, __VERB__ todos mis proyectos.',
        er: 'En diciembre, tú __VERB__ mucho español.',
        ir: 'Para entonces, nosotros __VERB__ qué hacer.',
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
        ar: 'Si hubiera tenido tiempo, __VERB__ más para el examen.',
        er: 'Con más dinero, __VERB__ por todo el mundo.',
        ir: 'Ellos __VERB__ el proyecto si hubieran tenido ayuda.',
    },
  },
  subjPerf: {
    title: 'Espero que haya...',
    sentences: {
        ar: 'Espero que __VERB__ para el examen de mañana.',
        er: 'Es posible que __VERB__ algo en mal estado.',
        ir: 'Dudo que __VERB__ demasiado tarde.',
    },
  },
  subjPlusc: {
    title: 'Si hubiera sabido...',
    sentences: {
        ar: 'Si __VERB__ más, habría aprobado el examen.',
        er: 'Ojalá __VERB__ a la fiesta, te habría gustado mucho.',
        ir: 'Si __VERB__ antes, habrían visto el espectáculo.',
    },
  },
};