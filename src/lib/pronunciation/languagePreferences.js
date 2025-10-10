const REGION_TO_DIALECT = {
  rioplatense: 'rioplatense',
  la_general: 'general',
  peninsular: 'peninsular'
};

const DIALECT_LANGUAGE_PREFERENCES = {
  rioplatense: {
    locale: 'es-AR',
    voiceOrder: ['es-ar', 'es-419', 'es-mx', 'es-es', 'es-us']
  },
  general: {
    locale: 'es-419',
    voiceOrder: ['es-419', 'es-mx', 'es-ar', 'es-es', 'es-us']
  },
  peninsular: {
    locale: 'es-ES',
    voiceOrder: ['es-es', 'es-419', 'es-mx', 'es-ar', 'es-us']
  }
};

const DEFAULT_DIALECT = 'general';

export function resolveDialect(region) {
  return REGION_TO_DIALECT[region] || DEFAULT_DIALECT;
}

export function getSpeechLanguagePreferences(region) {
  const dialect = resolveDialect(region);
  const preferences = DIALECT_LANGUAGE_PREFERENCES[dialect] || DIALECT_LANGUAGE_PREFERENCES[DEFAULT_DIALECT];
  return {
    dialect,
    ...preferences
  };
}

export { DIALECT_LANGUAGE_PREFERENCES };
