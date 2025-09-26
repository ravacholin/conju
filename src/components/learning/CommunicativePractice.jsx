import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatMoodTense } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { ERROR_TAGS } from '../../lib/progress/dataModels.js';
import { grade } from '../../lib/core/grader.js';
import { classifyError } from '../../lib/progress/tracking.js';
import { communicativeScenarios } from '../../data/communicativeScenarios.js';
import { normalizeFormValue, normalizeTextForComparison } from '../../lib/utils/normalizeFormValue.js';
import './CommunicativePractice.css';

const PHASES = {
  PRE: 'pre',
  INTERACTION: 'interaction',
  REFLECTION: 'reflection',
};

const tenseRegexBuilders = {
  pres: () => /\b(?:soy|eres|es|somos|sois|son|estoy|estás|está|estamos|estáis|están|voy|vas|va|vamos|vais|van|\w+(?:o|as|es|amos|emos|imos|an|en))\b/gi,
  pretIndef: () => /\b(?:fui|fuiste|fue|fuimos|fuisteis|fueron|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|\w+(?:é|aste|ó|amos|asteis|aron|í|iste|ió|imos|isteis|ieron))\b/gi,
  impf: () => /\b(?:era|eras|éramos|erais|eran|estaba|estabas|estábamos|estabais|estaban|\w+(?:aba|abas|ábamos|abais|aban|ía|ías|íamos|íais|ían))\b/gi,
  fut: () => /\b(?:seré|serás|será|seremos|seréis|serán|estaré|estarás|estará|estaremos|estaréis|estarán|\w+(?:ré|rás|rá|remos|réis|rán))\b/gi,
  pretPerf: () => /\b(?:he|has|ha|hemos|habéis|han)\s+(?:\w+(?:ado|ido|cho|to|so))\b/gi,
  cond: () => /\b(?:sería|serías|sería|seríamos|seríais|serían|\w+(?:ría|rías|ríamos|ríais|rían))\b/gi,
  plusc: () => /\b(?:hab(?:i|í)a|hab(?:i|í)as|hab(?:i|í)amos|hab(?:i|í)ais|hab(?:i|í)an)\s+(?:\w+(?:ado|ido|cho|to|so))\b/gi,
  futPerf: () => /\b(?:habr(?:e|é)|habr(?:as|ás)|habr(?:a|á)|habr(?:emos|émos)|habr(?:eis|éis)|habr(?:an|án))\s+(?:\w+(?:ado|ido|cho|to|so))\b/gi,
  subjPres: () => /\b(?:sea|seas|seamos|seáis|sean|esté|estés|estemos|estéis|estén|\w+(?:e|es|emos|éis|en|a|as|amos|áis|an))\b/gi,
  subjImpf: () => /\b(?:fuera|fueras|fuéramos|fuerais|fueran|fuese|fueses|fuésemos|fueseis|fuesen|\w+(?:ra|ras|ramos|rais|ran|se|ses|semos|seis|sen))\b/gi,
  subjPerf: () => /\b(?:haya|hayas|hayamos|hayáis|hayan)\s+(?:\w+(?:ado|ido|cho|to|so))\b/gi,
  subjPlusc: () => /\b(?:hubier(?:a|á)|hubier(?:as|ás)|hubier(?:amos|ámos)|hubier(?:ais|áis)|hubier(?:an|án)|hubies(?:e|é)|hubies(?:es|és)|hubies(?:emos|émos)|hubies(?:eis|éis)|hubies(?:en|én))\s+(?:\w+(?:ado|ido|cho|to|so))\b/gi,
  condPerf: () => /\b(?:habr(?:i|í)a|habr(?:i|í)as|habr(?:i|í)amos|habr(?:i|í)ais|habr(?:i|í)an)\s+(?:\w+(?:ado|ido|cho|to|so))\b/gi,
};

const tenseHints = {
  pres: 'Volvé al presente: "trabajo", "estudio", "salgo".',
  pretIndef: 'Usá acciones puntuales: "fui", "hice", "comí".',
  impf: 'Descrí el contexto con imperfecto: "vivía", "jugaba", "tenía".',
  fut: 'Proyectá en futuro: "estudiaré", "viajaré", "ahorraré".',
  pretPerf: 'Conectá con el presente usando "he + participio".',
  cond: 'Habla de hipótesis con "-ría": "viajaría", "cambiaría".',
  plusc: 'Marcá el pasado anterior con "había + participio".',
  futPerf: 'Imaginá logros futuros con "habré + participio".',
  subjPres: 'Usá expresiones como "quiero que" + subjuntivo.',
  subjImpf: 'Combiná "si" con formas en "-ra" o "-se".',
  subjPerf: 'Expresá deseos recientes con "haya + participio".',
  subjPlusc: 'Para lamentar el pasado, usá "hubiera/hubiese + participio".',
  condPerf: 'Mostrá alternativas con "habría + participio".',
};

const defaultGradeSettings = {
  accentTolerance: 'warn',
  strict: false,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectTenseUsage(userText, expectedTense) {
  const normalized = normalizeTextForComparison(userText);
  if (!normalized) {
    return { hasExpectedTense: false, wrongTenses: [] };
  }

  const wrongTenses = [];
  let hasExpectedTense = false;

  Object.entries(tenseRegexBuilders).forEach(([tense, builder]) => {
    const regex = builder();
    if (regex.test(normalized)) {
      if (tense === expectedTense) {
        hasExpectedTense = true;
      } else {
        wrongTenses.push(tense);
      }
    }
  });

  return {
    hasExpectedTense,
    wrongTenses,
  };
}

function buildCandidatePhrases(tokens) {
  const phrases = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const single = tokens[i];
    if (single) {
      phrases.push(single);
    }
    if (i < tokens.length - 1) {
      phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    if (i < tokens.length - 2) {
      phrases.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
    }
  }
  return phrases;
}

function selectFormForTarget(target, availableForms) {
  if (!target) return null;
  const { match = {} } = target;

  const matchIndex = availableForms.findIndex(form => {
    if (!form) return false;
    if (match.person && form.person !== match.person) return false;
    if (match.lemmas) {
      const lemmas = Array.isArray(match.lemmas) ? match.lemmas : [match.lemmas];
      if (!lemmas.includes(form.lemma)) return false;
    }
    if (match.tense && form.tense !== match.tense) return false;
    if (match.mood && form.mood !== match.mood) return false;
    return true;
  });

  let selected = null;
  if (matchIndex >= 0) {
    selected = availableForms[matchIndex];
  } else if (!match || Object.keys(match).length === 0) {
    selected = availableForms[0];
  }

  if (selected && target.allowReuse !== true) {
    const removalIndex = availableForms.findIndex(form => form === selected);
    if (removalIndex >= 0) {
      availableForms.splice(removalIndex, 1);
    }
  }

  return selected || null;
}

function resolveScenario(template, eligibleForms = []) {
  if (!template) return null;
  const available = [...eligibleForms];

  const resolvedSteps = (template.conversationSteps || []).map(step => {
    const resolvedTargets = (step.targetForms || []).map(target => {
      const selectedForm = selectFormForTarget(target, available);
      const expectedValue = selectedForm?.value || target.fallbackForm || null;
      return {
        ...target,
        form: selectedForm || null,
        resolvedValue: expectedValue,
        acceptedPhrases: target.acceptedPhrases || [],
        synonyms: target.synonyms || [],
      };
    });

    return {
      ...step,
      resolvedTargetForms: resolvedTargets,
    };
  });

  return {
    ...template,
    resolvedSteps,
    bridgeForms: eligibleForms.slice(0, 6).map(form => form.value),
  };
}

function collectAcceptableStrings(target) {
  const values = new Set();
  if (target.form?.value) values.add(target.form.value);
  if (Array.isArray(target.form?.alt)) {
    target.form.alt.forEach(val => values.add(val));
  }
  if (target.resolvedValue) values.add(target.resolvedValue);
  if (target.acceptedPhrases) {
    target.acceptedPhrases.forEach(val => values.add(val));
  }
  if (target.synonyms) {
    target.synonyms.forEach(val => values.add(val));
  }
  return [...values];
}

export function evaluateCommunicativeTurn({
  userText,
  step,
  eligibleForms = [],
  gradeSettings = defaultGradeSettings,
}) {
  const safeText = userText || '';
  const normalizedFull = normalizeTextForComparison(safeText);
  const tokenized = safeText
    .replace(/[.,!?;:]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const normalizedTokens = tokenized.map(token => normalizeFormValue(token));
  const candidatePhrases = buildCandidatePhrases(tokenized);

  const expectedForms = [];
  const fullMatches = [];
  const partialMatches = [];
  const missingTargets = [];
  const aggregateErrorTags = new Set();

  const gradeConfig = { ...defaultGradeSettings, ...gradeSettings };

  (step?.resolvedTargetForms || []).forEach(target => {
    const acceptableStrings = collectAcceptableStrings(target);
    if (acceptableStrings.length > 0) {
      expectedForms.push(acceptableStrings[0]);
    }

    let matched = false;
    const normalizedAcceptables = acceptableStrings.map(value => ({
      original: value,
      normalized: normalizeTextForComparison(value),
    }));

    // Check direct inclusion in the normalized text
    for (const acceptable of normalizedAcceptables) {
      if (!acceptable.normalized) continue;
      const regex = new RegExp(`\\b${escapeRegExp(acceptable.normalized)}\\b`, 'i');
      if (regex.test(normalizedFull)) {
        fullMatches.push({
          target,
          form: target.form || null,
          expected: acceptable.original,
        });
        matched = true;
        break;
      }
    }

    if (matched) {
      return;
    }

    const expectedForm = target.form || null;

    // Try candidate phrases (bigrams/trigrams) using grader
    for (const phrase of candidatePhrases) {
      if (!expectedForm || typeof phrase !== 'string' || !phrase.trim()) continue;
      const gradeResult = grade(phrase.trim(), expectedForm, gradeConfig);
      if (gradeResult.correct) {
        fullMatches.push({ target, form: expectedForm, expected: expectedForm.value });
        matched = true;
        break;
      }
      if (gradeResult.isAccentError) {
        partialMatches.push({
          target,
          form: expectedForm,
          token: phrase.trim(),
          errors: [ERROR_TAGS.ACCENT],
        });
        aggregateErrorTags.add(ERROR_TAGS.ACCENT);
        matched = true;
        break;
      }
    }

    if (matched) {
      return;
    }

    if (expectedForm) {
      // Explore word-level attempts for partial credit
      for (let index = 0; index < normalizedTokens.length; index += 1) {
        const token = tokenized[index];
        const normalizedToken = normalizedTokens[index];
        if (!token || !normalizedToken) continue;

        const classification = classifyError(token, expectedForm.value, expectedForm) || [];
        if (classification.includes(ERROR_TAGS.OTHER_VALID_FORM) || classification.includes(ERROR_TAGS.WRONG_TENSE) || classification.includes(ERROR_TAGS.WRONG_PERSON) || classification.includes(ERROR_TAGS.ACCENT)) {
          partialMatches.push({
            target,
            form: expectedForm,
            token,
            errors: classification,
          });
          classification.forEach(tag => aggregateErrorTags.add(tag));
          matched = true;
          break;
        }
      }
    }

    if (!matched && !target.optional) {
      missingTargets.push(target);
      aggregateErrorTags.add(ERROR_TAGS.MISSING_VERBS);
    }
  });

  const requiredTargets = (step?.resolvedTargetForms || []).filter(target => !target.optional).length;
  const denominator = requiredTargets > 0 ? requiredTargets : (step?.resolvedTargetForms?.length || 1);
  const matchedCount = fullMatches.filter(match => !match.target?.optional).length;
  const partialCount = partialMatches.filter(match => !match.target?.optional).length;
  const score = Math.max(0, Math.min(1, (matchedCount + partialCount * 0.5) / denominator));

  return {
    expectedForms,
    fullMatches,
    partialMatches,
    missingTargets,
    aggregateErrorTags: [...aggregateErrorTags],
    score,
  };
}

function summarizeMissingTargets(targets) {
  if (!targets || targets.length === 0) return '';
  return targets
    .map(target => target.resolvedValue || target.fallbackForm)
    .filter(Boolean)
    .map(value => `«${value}»`)
    .join(', ');
}

function summarizePartialMatches(partials) {
  if (!partials || partials.length === 0) return '';
  return partials
    .map(match => {
      const base = match.form?.value || match.target?.resolvedValue || '';
      if (!base) return null;
      if (!match.errors || match.errors.length === 0) return `Intentaste con «${base}», revisá la forma.`;
      return `«${base}» necesita ajuste (${match.errors.join(', ')}).`;
    })
    .filter(Boolean)
    .join(' ');
}

function CommunicativePractice({ tense, eligibleForms = [], onBack, onFinish }) {
  const [phase, setPhase] = useState(PHASES.PRE);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [reflectionNotes, setReflectionNotes] = useState('');

  const scenarioTemplate = tense?.tense ? communicativeScenarios[tense.tense] : null;
  const scenario = useMemo(
    () => resolveScenario(scenarioTemplate, eligibleForms || []),
    [scenarioTemplate, eligibleForms]
  );

  useEffect(() => {
    setPhase(PHASES.PRE);
    setMessages([]);
    setInputValue('');
    setCurrentStepIndex(0);
    setReflectionNotes('');
  }, [scenario]);

  const currentStep = phase === PHASES.INTERACTION ? scenario?.resolvedSteps?.[currentStepIndex] : null;
  const nextStep = phase === PHASES.INTERACTION ? scenario?.resolvedSteps?.[currentStepIndex + 1] : null;

  const bridgeForms = useMemo(() => {
    if (scenario?.bridgeForms?.length) return scenario.bridgeForms;
    return (eligibleForms || [])
      .filter(form => !tense?.tense || form.tense === tense.tense)
      .slice(0, 6)
      .map(form => form.value);
  }, [scenario, eligibleForms, tense?.tense]);

  const currentItem = useMemo(
    () => ({
      id: `communicative-practice-${tense?.tense || 'unknown'}`,
      lemma: 'communicative-practice',
      tense: tense?.tense,
      mood: tense?.mood,
    }),
    [tense]
  );

  const { handleResult } = useProgressTracking(currentItem);

  const startInteraction = useCallback(() => {
    setPhase(PHASES.INTERACTION);
    if (scenario?.resolvedSteps?.length) {
      setMessages([
        {
          author: 'bot',
          text: scenario.resolvedSteps[0].prompt,
          stepId: scenario.resolvedSteps[0].id,
        },
      ]);
      setCurrentStepIndex(0);
    }
  }, [scenario]);

  useEffect(() => {
    if (phase === PHASES.INTERACTION && scenario?.resolvedSteps?.length && messages.length === 0) {
      setMessages([
        {
          author: 'bot',
          text: scenario.resolvedSteps[0].prompt,
          stepId: scenario.resolvedSteps[0].id,
        },
      ]);
    }
  }, [phase, scenario, messages.length]);

  const updateSchedulesForEvaluation = useCallback(async (stepId, evaluation, isSuccess) => {
    if (!Array.isArray(eligibleForms) || eligibleForms.length === 0) {
      return;
    }
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const processed = new Set();

      for (const match of evaluation.fullMatches) {
        const form = match.form;
        if (!form) continue;
        const key = `${form.lemma}|${form.person}|${form.tense}`;
        if (processed.has(key)) continue;
        processed.add(key);
        await updateSchedule(userId, form, true, 0, {
          source: 'communicative-practice',
          stepId,
          evaluation: 'full',
        });
      }

      for (const partial of evaluation.partialMatches) {
        const form = partial.form;
        if (!form) continue;
        const key = `${form.lemma}|${form.person}|${form.tense}`;
        if (processed.has(key)) continue;
        processed.add(key);
        await updateSchedule(userId, form, false, 0, {
          source: 'communicative-practice',
          stepId,
          evaluation: 'partial',
          errorTags: partial.errors,
        });
      }

      for (const missing of evaluation.missingTargets) {
        const form = missing.form;
        if (!form) continue;
        const key = `${form.lemma}|${form.person}|${form.tense}`;
        if (processed.has(key)) continue;
        processed.add(key);
        await updateSchedule(userId, form, false, 1, {
          source: 'communicative-practice',
          stepId,
          evaluation: 'missed',
        });
      }
    } catch (error) {
      console.error('Failed to update SRS schedule for communicative practice:', error);
    }
  }, [eligibleForms]);

  const handleSendMessage = useCallback(async () => {
    if (phase !== PHASES.INTERACTION || !currentStep || !inputValue.trim()) {
      return;
    }

    const userMessage = { author: 'user', text: inputValue.trim(), stepId: currentStep.id };
    const nextMessages = [...messages, userMessage];

    const evaluation = evaluateCommunicativeTurn({
      userText: inputValue,
      step: currentStep,
      eligibleForms,
      gradeSettings: defaultGradeSettings,
    });

    const tenseAnalysis = tense?.tense ? detectTenseUsage(inputValue, tense.tense) : { hasExpectedTense: true, wrongTenses: [] };
    if (!tenseAnalysis.hasExpectedTense && tenseAnalysis.wrongTenses.length > 0) {
      evaluation.aggregateErrorTags.push(ERROR_TAGS.WRONG_TENSE_USED);
    }

    const isSuccessfulTurn = evaluation.missingTargets.length === 0 && evaluation.partialMatches.length === 0;

    const summaryParts = [];
    if (evaluation.missingTargets.length > 0) {
      summaryParts.push(`Nos faltó usar: ${summarizeMissingTargets(evaluation.missingTargets)}.`);
    }
    if (evaluation.partialMatches.length > 0) {
      summaryParts.push(summarizePartialMatches(evaluation.partialMatches));
    }
    if (!tenseAnalysis.hasExpectedTense && tenseAnalysis.wrongTenses.length > 0) {
      const hint = tenseHints[tense.tense] || 'Revisá el tiempo verbal objetivo.';
      summaryParts.push(hint);
    }

    const feedbackText = isSuccessfulTurn
      ? currentStep.successResponse || '¡Excelente! Cumpliste el objetivo de esta parte.'
      : [currentStep.hint || 'Probemos otra vez usando los verbos objetivo.', ...summaryParts.filter(Boolean)].join(' ');

    const botResponse = { author: 'bot', text: feedbackText, stepId: currentStep.id };

    const updatedMessages = [...nextMessages, botResponse];

    if (isSuccessfulTurn) {
      if (nextStep) {
        updatedMessages.push({
          author: 'bot',
          text: nextStep.prompt,
          stepId: nextStep.id,
        });
      } else {
        updatedMessages.push({
          author: 'bot',
          text: 'Excelente trabajo. Pasemos a la reflexión final.',
          stepId: 'reflection-intro',
        });
      }
    }

    setMessages(updatedMessages);

    await handleResult({
      correct: isSuccessfulTurn,
      userAnswer: inputValue,
      correctAnswer: evaluation.expectedForms.filter(Boolean).join(', '),
      hintsUsed: isSuccessfulTurn ? 0 : 1,
      errorTags: evaluation.aggregateErrorTags,
      latencyMs: 0,
      isIrregular: false,
      itemId: currentItem.id,
      partialCredit: evaluation.score,
      conversationContext: {
        phase,
        stepId: currentStep.id,
        goal: currentStep.goal,
        expectedForms: evaluation.expectedForms,
        evaluation,
        tenseAnalysis,
      },
    });

    await updateSchedulesForEvaluation(currentStep.id, evaluation, isSuccessfulTurn);

    if (isSuccessfulTurn) {
      if (nextStep) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        setPhase(PHASES.REFLECTION);
      }
    }

    setInputValue('');
  }, [
    phase,
    currentStep,
    inputValue,
    messages,
    eligibleForms,
    tense,
    currentItem.id,
    handleResult,
    updateSchedulesForEvaluation,
    nextStep,
    currentStepIndex,
  ]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (phase === PHASES.INTERACTION) {
          handleSendMessage();
        } else if (phase === PHASES.REFLECTION) {
          onFinish();
        }
      }
    },
    [handleSendMessage, onFinish, phase]
  );

  if (!scenario) {
    return (
      <div className="center-column">
        <p>Estamos preparando actividades comunicativas para este tiempo verbal.</p>
        <button onClick={onBack} className="btn-secondary">Volver</button>
      </div>
    );
  }

  return (
    <div className="App learn-flow">
      <div className="center-column">
        <div className="drill-header-learning">
          <button onClick={onBack} className="back-btn-drill">
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
          <h2>Práctica Comunicativa: {formatMoodTense(tense?.mood, tense?.tense)}</h2>
        </div>

        {phase === PHASES.PRE && (
          <div className="pre-task-panel">
            <h3>{scenario.title}</h3>
            <p className="pre-task-context">{scenario.preTask?.context}</p>
            {scenario.preTask?.objectives?.length > 0 && (
              <div className="pre-task-section">
                <h4>Objetivos</h4>
                <ul>
                  {scenario.preTask.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
            {scenario.preTask?.activationQuestions?.length > 0 && (
              <div className="pre-task-section">
                <h4>Activa tu conocimiento</h4>
                <ul>
                  {scenario.preTask.activationQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
            {bridgeForms.length > 0 && (
              <div className="pre-task-section">
                <h4>Verbos puente</h4>
                <div className="bridge-forms">
                  {bridgeForms.map(form => (
                    <span key={form} className="bridge-form-chip">{form}</span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={startInteraction} className="btn-primary">Comenzar conversación</button>
          </div>
        )}

        {phase === PHASES.INTERACTION && (
          <div className="communicative-layout">
            <div className="chat-container">
              <div className="message-list">
                {messages.map((message, index) => (
                  <div key={index} className={`message ${message.author}`}>
                    {message.text}
                  </div>
                ))}
              </div>
              <div className="input-area">
                <textarea
                  placeholder="Escribe tu respuesta..."
                  value={inputValue}
                  onChange={event => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button onClick={handleSendMessage} className="btn-primary">Enviar</button>
              </div>
            </div>
            {currentStep && (
              <aside className="interaction-support">
                <h4>Objetivo del turno</h4>
                <p>{currentStep.goal}</p>
                {currentStep.supportPhrases?.length > 0 && (
                  <div className="support-phrases">
                    <h5>Frases de apoyo</h5>
                    <ul>
                      {currentStep.supportPhrases.map((phrase, index) => (
                        <li key={index}>{phrase}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentStep.resolvedTargetForms?.length > 0 && (
                  <div className="support-targets">
                    <h5>Formas objetivo</h5>
                    <ul>
                      {currentStep.resolvedTargetForms.map((target, index) => (
                        <li key={index}>{target.resolvedValue || target.fallbackForm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            )}
          </div>
        )}

        {phase === PHASES.REFLECTION && (
          <div className="reflection-panel">
            <h3>Cierre reflexivo</h3>
            <p>Antes de finalizar, tomá un momento para consolidar lo que usaste.</p>
            {scenario.postTask?.prompts?.length > 0 && (
              <div className="reflection-section">
                <h4>Preguntas para reflexionar</h4>
                <ul>
                  {scenario.postTask.prompts.map((prompt, index) => (
                    <li key={index}>{prompt}</li>
                  ))}
                </ul>
              </div>
            )}
            {scenario.postTask?.successCriteria?.length > 0 && (
              <div className="reflection-section">
                <h4>Rúbrica de éxito</h4>
                <ul>
                  {scenario.postTask.successCriteria.map((criterion, index) => (
                    <li key={index}>{criterion}</li>
                  ))}
                </ul>
              </div>
            )}
            <textarea
              className="reflection-notes"
              placeholder="Anotá ideas o frases que quieras recordar (opcional)"
              value={reflectionNotes}
              onChange={event => setReflectionNotes(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            {scenario.postTask?.consolidationTip && (
              <p className="consolidation-tip">💡 {scenario.postTask.consolidationTip}</p>
            )}
            <button onClick={onFinish} className="btn-primary">Finalizar práctica</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunicativePractice;
