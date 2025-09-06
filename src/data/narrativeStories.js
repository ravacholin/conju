/**
 * Narrative story data for learning module
 * Contains complete stories, sentences, and deconstructions for each tense
 */

export const storyData = {
  pres: {
    title: 'La rutina de Juan',
    sentences: [
      { text: 'Todos los días, Juan __habla__ con sus amigos.', verb: 'habla' },
      { text: 'Siempre __aprende__ algo nuevo.', verb: 'aprende' },
      { text: 'Él __vive__ en el centro de la ciudad.', verb: 'vive' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['o', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-er', verb: 'aprender', stem: 'aprend', endings: ['o', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['o', 'es', 'e', 'imos', 'ís', 'en'] },
    ],
  },
  pretIndef: {
    title: 'Una tarde ocupada',
    sentences: [
      { text: 'Ayer, María __caminó__ por el parque.', verb: 'caminó' },
      { text: 'Luego, __comió__ un helado de fresa.', verb: 'comió' },
      { text: 'Finalmente, __escribió__ una carta a su abuela.', verb: 'escribió' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'caminar', stem: 'camin', endings: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'] },
      { group: '-er', verb: 'comer', stem: 'com', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
      { group: '-ir', verb: 'escribir', stem: 'escrib', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
    ],
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: [
      { text: 'Cuando era niño, __jugaba__ en el parque.', verb: 'jugaba' },
      { text: 'Mi madre siempre me __leía__ un cuento.', verb: 'leía' },
      { text: 'Nosotros __vivíamos__ en una casa pequeña.', verb: 'vivíamos' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'jugar', stem: 'jug', endings: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'] },
      { group: '-er', verb: 'leer', stem: 'le', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
    irregularStory: {
      title: 'Los únicos tres irregulares del imperfecto',
      introduction: 'En el imperfecto, casi todos los verbos son regulares. Solo hay 3 verbos irregulares en todo el español: ser, ir y ver.',
      concept: 'Estos verbos tienen formas completamente irregulares que hay que memorizar. No siguen ningún patrón de los verbos regulares.',
      sentences: [
        { text: 'Mi abuelo __era__ muy divertido y siempre nos contaba historias.', verb: 'era', lemma: 'ser' },
        { text: 'Todos los veranos __íbamos__ a la playa con toda la familia.', verb: 'íbamos', lemma: 'ir' },
        { text: 'Por las noches __veía__ las estrellas desde la ventana de mi cuarto.', verb: 'veía', lemma: 'ver' }
      ],
      paradigms: [
        {
          lemma: 'ser',
          meaning: 'to be (permanent qualities, identity)',
          forms: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
          example: 'Él era muy alto cuando era joven.'
        },
        {
          lemma: 'ir',
          meaning: 'to go',
          forms: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
          example: 'Todos los días iba al colegio caminando.'
        },
        {
          lemma: 'ver',
          meaning: 'to see',
          forms: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
          example: 'Desde mi ventana veía el mar a lo lejos.'
        }
      ]
    }
  },
  fut: {
    title: 'Planes para el futuro',
    sentences: [
      { text: 'Mañana, __hablaré__ con mi jefe.', verb: 'hablaré' },
      { text: 'Pronto __haré__ mi tarea.', verb: 'haré' },
      { text: 'Después __saldré__ con mis amigos.', verb: 'saldré' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'hablar', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-er', verb: 'hacer', stem: 'har', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-ir', verb: 'salir', stem: 'saldr', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
    ],
  },
  cond: {
    title: 'Un mundo ideal',
    sentences: [
      { text: 'Si tuviera tiempo, __hablaría__ con mi familia más.', verb: 'hablaría' },
      { text: 'Nosotros __haríamos__ un viaje increíble.', verb: 'haríamos' },
      { text: '¿Tú qué __dirías__ en esa situación?', verb: 'dirías' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'hablar', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-er', verb: 'hacer', stem: 'har', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'decir', stem: 'dir', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  subjPres: {
    title: 'Deseos y Recomendaciones',
    sentences: [
      { text: 'Espero que __tengas__ un buen día.', verb: 'tengas' },
      { text: 'El doctor recomienda que __bebas__ más agua.', verb: 'bebas' },
      { text: 'Quiero que __seamos__ buenos amigos.', verb: 'seamos' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['e', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-er', verb: 'beber', stem: 'beb', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
    ],
  },
  pretPerf: {
    title: 'Lo que hemos hecho hoy',
    sentences: [
      { text: 'Esta mañana __he trabajado__ en un proyecto importante.', verb: 'he trabajado' },
      { text: 'Mi hermana __ha comido__ ya su desayuno.', verb: 'ha comido' },
      { text: 'Nosotros __hemos vivido__ muchas experiencias juntos.', verb: 'hemos vivido' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'trabajar', stem: 'he/has/ha/hemos/habéis/han', endings: ['trabajado', 'trabajado', 'trabajado', 'trabajado', 'trabajado', 'trabajado'] },
      { group: '-er', verb: 'comer', stem: 'he/has/ha/hemos/habéis/han', endings: ['comido', 'comido', 'comido', 'comido', 'comido', 'comido'] },
      { group: '-ir', verb: 'vivir', stem: 'he/has/ha/hemos/habéis/han', endings: ['vivido', 'vivido', 'vivido', 'vivido', 'vivido', 'vivido'] },
    ],
  },
  plusc: {
    title: 'Recuerdos del pasado',
    sentences: [
      { text: 'Cuando llegamos, él ya __había hablado__ con el director.', verb: 'había hablado' },
      { text: 'María __había comido__ antes de ir al cine.', verb: 'había comido' },
      { text: 'Ellos __habían vivido__ allí durante muchos años.', verb: 'habían vivido' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'había/habías/había/habíamos/habíais/habían', endings: ['hablado', 'hablado', 'hablado', 'hablado', 'hablado', 'hablado'] },
      { group: '-er', verb: 'comer', stem: 'había/habías/había/habíamos/habíais/habían', endings: ['comido', 'comido', 'comido', 'comido', 'comido', 'comido'] },
      { group: '-ir', verb: 'vivir', stem: 'había/habías/había/habíamos/habíais/habían', endings: ['vivido', 'vivido', 'vivido', 'vivido', 'vivido', 'vivido'] },
    ],
  },
  futPerf: {
    title: 'Lo que habremos logrado',
    sentences: [
      { text: 'Para el viernes, __habré terminado__ todos mis proyectos.', verb: 'habré terminado' },
      { text: 'En diciembre, tú __habrás aprendido__ mucho español.', verb: 'habrás aprendido' },
      { text: 'Para entonces, nosotros __habremos decidido__ qué hacer.', verb: 'habremos decidido' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'terminar', stem: 'habré/habrás/habrá/habremos/habréis/habrán', endings: ['terminado', 'terminado', 'terminado', 'terminado', 'terminado', 'terminado'] },
      { group: '-er', verb: 'aprender', stem: 'habré/habrás/habrá/habremos/habréis/habrán', endings: ['aprendido', 'aprendido', 'aprendido', 'aprendido', 'aprendido', 'aprendido'] },
      { group: '-ir', verb: 'decidir', stem: 'habré/habrás/habrá/habremos/habréis/habrán', endings: ['decidido', 'decidido', 'decidido', 'decidido', 'decidido', 'decidido'] },
    ],
  },
  subjImpf: {
    title: 'Si fuera posible...',
    sentences: [
      { text: 'Si __hablara__ más español, podría conseguir un mejor trabajo.', verb: 'hablara' },
      { text: 'Ojalá __tuviera__ más tiempo para estudiar.', verb: 'tuviera' },
      { text: 'Si __fueran__ más amables, todo sería mejor.', verb: 'fueran' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['ara', 'aras', 'ara', 'áramos', 'arais', 'aran'] },
      { group: '-er', verb: 'tener', stem: 'tuvi', endings: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'] },
      { group: '-ir', verb: 'ir', stem: 'fu', endings: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'] },
    ],
  },
  condPerf: {
    title: 'Lo que habría pasado',
    sentences: [
      { text: 'Si hubiera tenido tiempo, __habría estudiado__ más para el examen.', verb: 'habría estudiado' },
      { text: 'Con más dinero, __habríamos viajado__ por todo el mundo.', verb: 'habríamos viajado' },
      { text: 'Ellos __habrían terminado__ el proyecto si hubieran tenido ayuda.', verb: 'habrían terminado' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'estudiar', stem: 'habría/habrías/habría/habríamos/habríais/habrían', endings: ['estudiado', 'estudiado', 'estudiado', 'estudiado', 'estudiado', 'estudiado'] },
      { group: '-ar', verb: 'viajar', stem: 'habría/habrías/habría/habríamos/habríais/habrían', endings: ['viajado', 'viajado', 'viajado', 'viajado', 'viajado', 'viajado'] },
      { group: '-ar', verb: 'terminar', stem: 'habría/habrías/habría/habríamos/habríais/habrían', endings: ['terminado', 'terminado', 'terminado', 'terminado', 'terminado', 'terminado'] },
    ],
  },
  subjPerf: {
    title: 'Espero que haya...',
    sentences: [
      { text: 'Espero que __hayas estudiado__ para el examen de mañana.', verb: 'hayas estudiado' },
      { text: 'Es posible que __haya comido__ algo en mal estado.', verb: 'haya comido' },
      { text: 'Dudo que __hayamos llegado__ demasiado tarde.', verb: 'hayamos llegado' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'estudiar', stem: 'haya/hayas/haya/hayamos/hayáis/hayan', endings: ['estudiado', 'estudiado', 'estudiado', 'estudiado', 'estudiado', 'estudiado'] },
      { group: '-er', verb: 'comer', stem: 'haya/hayas/haya/hayamos/hayáis/hayan', endings: ['comido', 'comido', 'comido', 'comido', 'comido', 'comido'] },
      { group: '-ir', verb: 'llegar', stem: 'haya/hayas/haya/hayamos/hayáis/hayan', endings: ['llegado', 'llegado', 'llegado', 'llegado', 'llegado', 'llegado'] },
    ],
  },
  subjPlusc: {
    title: 'Si hubiera sabido...',
    sentences: [
      { text: 'Si __hubiera estudiado__ más, habría aprobado el examen.', verb: 'hubiera estudiado' },
      { text: 'Ojalá __hubieras venido__ a la fiesta, te habría gustado mucho.', verb: 'hubieras venido' },
      { text: 'Si __hubieran llegado__ antes, habrían visto el espectáculo.', verb: 'hubieran llegado' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'estudiar', stem: 'hubiera/hubieras/hubiera/hubiéramos/hubierais/hubieran', endings: ['estudiado', 'estudiado', 'estudiado', 'estudiado', 'estudiado', 'estudiado'] },
      { group: '-ir', verb: 'venir', stem: 'hubiera/hubieras/hubiera/hubiéramos/hubierais/hubieran', endings: ['venido', 'venido', 'venido', 'venido', 'venido', 'venido'] },
      { group: '-ar', verb: 'llegar', stem: 'hubiera/hubieras/hubiera/hubiéramos/hubierais/hubieran', endings: ['llegado', 'llegado', 'llegado', 'llegado', 'llegado', 'llegado'] },
    ],
  },
};