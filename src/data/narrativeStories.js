/**
 * Narrative story data for learning module
 * Contains TEMPLATES for stories for each tense.
 * The __VERB__ placeholder will be dynamically replaced.
 */

export const storyData = {
  pres: {
    title: 'La rutina de Juan',
    sentences: [
      { text: 'Todos los días, Juan __VERB__ con sus amigos.' },
      { text: 'Siempre __VERB__ algo nuevo.' },
      { text: 'Él __VERB__ en el centro de la ciudad.' },
    ],
  },
  pretIndef: {
    title: 'Una tarde ocupada',
    sentences: [
      { text: 'Ayer, María __VERB__ por el parque.' },
      { text: 'Luego, __VERB__ un helado de fresa.' },
      { text: 'Finalmente, __VERB__ una carta a su abuela.' },
    ],
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: [
      { text: 'Cuando era niño, __VERB__ en el parque.' },
      { text: 'Mi madre siempre me __VERB__ un cuento.' },
      { text: 'Nosotros __VERB__ en una casa pequeña.' },
    ],
  },
  fut: {
    title: 'Planes para el futuro',
    sentences: [
      { text: 'Mañana, __VERB__ con mi jefe.' },
      { text: 'Pronto __VERB__ mi tarea.' },
      { text: 'Después __VERB__ con mis amigos.' },
    ],
  },
  cond: {
    title: 'Un mundo ideal',
    sentences: [
      { text: 'Si tuviera tiempo, __VERB__ con mi familia más.' },
      { text: 'Nosotros __VERB__ un viaje increíble.' },
      { text: '¿Tú qué __VERB__ en esa situación?' },
    ],
  },
  subjPres: {
    title: 'Deseos y Recomendaciones',
    sentences: [
      { text: 'Espero que __VERB__ un buen día.' },
      { text: 'El doctor recomienda que __VERB__ más agua.' },
      { text: 'Quiero que __VERB__ buenos amigos.' },
    ],
  },
  pretPerf: {
    title: 'Lo que hemos hecho hoy',
    sentences: [
      { text: 'Esta mañana __VERB__ en un proyecto importante.' },
      { text: 'Mi hermana __VERB__ ya su desayuno.' },
      { text: 'Nosotros __VERB__ muchas experiencias juntos.' },
    ],
  },
  plusc: {
    title: 'Recuerdos del pasado',
    sentences: [
      { text: 'Cuando llegamos, él ya __VERB__ con el director.' },
      { text: 'María __VERB__ antes de ir al cine.' },
      { text: 'Ellos __VERB__ allí durante muchos años.' },
    ],
  },
  futPerf: {
    title: 'Lo que habremos logrado',
    sentences: [
      { text: 'Para el viernes, __VERB__ todos mis proyectos.' },
      { text: 'En diciembre, tú __VERB__ mucho español.' },
      { text: 'Para entonces, nosotros __VERB__ qué hacer.' },
    ],
  },
  subjImpf: {
    title: 'Si fuera posible...',
    sentences: [
      { text: 'Si __VERB__ más español, podría conseguir un mejor trabajo.' },
      { text: 'Ojalá __VERB__ más tiempo para estudiar.' },
      { text: 'Si __VERB__ más amables, todo sería mejor.' },
    ],
  },
  condPerf: {
    title: 'Lo que habría pasado',
    sentences: [
      { text: 'Si hubiera tenido tiempo, __VERB__ más para el examen.' },
      { text: 'Con más dinero, __VERB__ por todo el mundo.' },
      { text: 'Ellos __VERB__ el proyecto si hubieran tenido ayuda.' },
    ],
  },
  subjPerf: {
    title: 'Espero que haya...',
    sentences: [
      { text: 'Espero que __VERB__ para el examen de mañana.' },
      { text: 'Es posible que __VERB__ algo en mal estado.' },
      { text: 'Dudo que __VERB__ demasiado tarde.' },
    ],
  },
  subjPlusc: {
    title: 'Si hubiera sabido...',
    sentences: [
      { text: 'Si __VERB__ más, habría aprobado el examen.' },
      { text: 'Ojalá __VERB__ a la fiesta, te habría gustado mucho.' },
      { text: 'Si __VERB__ antes, habrían visto el espectáculo.' },
    ],
  },
};