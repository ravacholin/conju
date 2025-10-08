// Utilidades de pronunciación extraídas para reutilización en paneles de drill

/**
 * Genera notación IPA simplificada para una palabra española
 * @param {string} word - Palabra a procesar
 * @returns {string} Notación IPA aproximada
 */
export const generateIPA = (word) => {
  // Versión simplificada - en producción se usaría un diccionario fonético
  return `/${word.replace(/h/g, '').replace(/qu/g, 'k').replace(/c([ei])/g, 'θ$1')}/`;
};

/**
 * Genera guía de pronunciación visual
 * @param {string} word - Palabra a procesar
 * @returns {string} Guía de pronunciación simplificada
 */
export const generatePronunciationGuide = (word) => {
  const digraphMap = {
    rr: 'RR',
    ll: 'LY',
    ch: 'CH'
  };

  let result = '';
  let index = 0;

  while (index < word.length) {
    const digraph = word.slice(index, index + 2).toLowerCase();

    if (digraphMap[digraph]) {
      result += digraphMap[digraph];
      index += 2;
      continue;
    }

    const char = word[index];
    const lowerChar = char.toLowerCase();

    switch (lowerChar) {
      case 'h':
        break; // Silent
      case 'j':
        result += 'H';
        break;
      case 'ñ':
        result += 'NY';
        break;
      default:
        result += char.toUpperCase();
        break;
    }

    index += 1;
  }

  return result;
};

/**
 * Genera consejos de pronunciación específicos
 * @param {string} word - Palabra a procesar
 * @param {string} verb - Verbo base (opcional)
 * @returns {string} Consejo de pronunciación
 */
export const generatePronunciationTip = (word, _verb) => {
  const tips = [];
  if (word.includes('h')) tips.push('La "h" es muda');
  if (word.includes('rr')) tips.push('Vibra la "rr" con la lengua');
  if (word.includes('ñ')) tips.push('Sonido "ny" con la lengua en el paladar');
  if (word.includes('j')) tips.push('"J" suave desde la garganta');
  if (word.includes('ll')) tips.push('"Ll" como "y" en la mayoría de regiones');

  return tips.length > 0 ? tips.join('. ') : 'Pronuncia cada sílaba claramente';
};

/**
 * Convierte un currentItem de drill a formato de pronunciación
 * @param {Object} currentItem - Item actual del drill
 * @returns {Object} Datos de pronunciación para el item
 */
export const convertCurrentItemToPronunciation = (currentItem) => {
  if (!currentItem) return null;

  const form = currentItem.value || currentItem.form?.value || currentItem.expectedValue || '';
  const verb = currentItem.lemma || '';

  return {
    verb: verb,
    form: form,
    person: currentItem.person || '',
    mood: currentItem.mood || '',
    tense: currentItem.tense || '',
    ipa: generateIPA(form),
    pronunciation: generatePronunciationGuide(form),
    tip: generatePronunciationTip(form, verb),
    audioKey: `${verb}_${currentItem.tense}_${currentItem.person}`
  };
};

/**
 * Text-to-Speech mejorado con optimización para voces españolas
 * @param {string} text - Texto a pronunciar
 * @param {string} lang - Idioma (default: 'es-ES')
 * @param {Object} options - Opciones de pronunciación
 */
export const speakText = (text, lang = 'es-ES', options = {}) => {
  if ('speechSynthesis' in window) {
    const speak = () => {
      // Cancelar cualquier pronunciación en curso
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = options.rate || 0.7; // Más lento para aprendizaje
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 0.8;

      // Buscar la mejor voz española femenina con alta calidad
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(voice =>
        voice.lang.startsWith('es') || voice.lang.includes('Spanish')
      );

      // Voces femeninas españolas de alta calidad (prioridad)
      const highQualityFemaleNames = [
        'microsoft helena', 'microsoft sabina', 'microsoft lucia',
        'google español', 'microsoft catalina', 'microsoft paloma',
        'carmela', 'monica', 'esperanza', 'penelope', 'ines',
        'verónica', 'paulina', 'lupe', 'claudia'
      ];

      // Filtrar solo voces femeninas de calidad
      const qualityFemaleVoices = spanishVoices.filter(voice => {
        const voiceName = voice.name.toLowerCase();
        return (
          // Voces específicamente femeninas de calidad
          highQualityFemaleNames.some(name => voiceName.includes(name)) ||
          // Voces que explícitamente dicen "female"
          voiceName.includes('female') ||
          // Excluir voces masculinas explícitas
          (!voiceName.includes('male') && !voiceName.includes('jorge') &&
           !voiceName.includes('carlos') && !voiceName.includes('diego') &&
           !voiceName.includes('android'))
        );
      });

      // Priorizar por región y calidad
      const preferredVoice =
        // 1. Voces de alta calidad para la región específica
        qualityFemaleVoices.find(voice =>
          voice.lang === lang && highQualityFemaleNames.some(name =>
            voice.name.toLowerCase().includes(name)
          )
        ) ||
        // 2. Cualquier voz de calidad para español
        qualityFemaleVoices.find(voice =>
          voice.lang.startsWith('es') && highQualityFemaleNames.some(name =>
            voice.name.toLowerCase().includes(name)
          )
        ) ||
        // 3. Cualquier voz femenina para la región
        qualityFemaleVoices.find(voice => voice.lang === lang) ||
        // 4. Cualquier voz femenina española
        qualityFemaleVoices.find(voice => voice.lang.startsWith('es')) ||
        // 5. Fallback a primera voz femenina
        qualityFemaleVoices[0] ||
        // 6. Último recurso: cualquier voz española
        spanishVoices[0];

      console.log('🔊 Selected voice:', preferredVoice?.name, preferredVoice?.lang);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Event handlers para mejor UX
      utterance.onstart = () => options.onStart?.();
      utterance.onend = () => options.onEnd?.();
      utterance.onerror = (e) => options.onError?.(e);

      window.speechSynthesis.speak(utterance);
    };

    // Asegurar que las voces estén cargadas
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      let hasSpoken = false;
      const speakOnce = () => {
        if (!hasSpoken) {
          hasSpoken = true;
          speak();
        }
      };
      window.speechSynthesis.addEventListener('voiceschanged', speakOnce, { once: true });
      setTimeout(speakOnce, 1000);
    } else {
      speak();
    }
  }
};