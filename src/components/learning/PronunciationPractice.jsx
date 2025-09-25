import React, { useState, useRef } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import './PronunciationPractice.css';

// Data para práctica de pronunciación con IPA y tips
const pronunciationData = {
  pres: {
    title: 'Pronunciación - Presente',
    verbs: [
      { 
        verb: 'hablar', 
        form: 'hablo',
        ipa: '/ˈa.βlo/',
        pronunciation: 'AH-blo',
        tip: 'La "h" es muda. Sonido suave de "b"',
        audioKey: 'hablo'
      },
      { 
        verb: 'comer', 
        form: 'comes',
        ipa: '/ˈko.mes/',
        pronunciation: 'KO-mes',
        tip: 'Vocal "o" cerrada, "e" clara',
        audioKey: 'comes'
      },
      { 
        verb: 'vivir', 
        form: 'vive',
        ipa: '/ˈbi.βe/',
        pronunciation: 'BEE-veh',
        tip: 'Primera "v" fuerte, segunda suave',
        audioKey: 'vive'
      },
      { 
        verb: 'ser', 
        form: 'soy',
        ipa: '/soi̯/',
        pronunciation: 'soy',
        tip: 'Diptongo "oy", no separar las vocales',
        audioKey: 'soy'
      },
      { 
        verb: 'tener', 
        form: 'tengo',
        ipa: '/ˈten.go/',
        pronunciation: 'TEN-go',
        tip: 'La "g" se pronuncia fuerte antes de "o"',
        audioKey: 'tengo'
      }
    ]
  },
  pretIndef: {
    title: 'Pronunciación - Pretérito Indefinido',
    verbs: [
      { 
        verb: 'hablar', 
        form: 'hablé',
        ipa: '/a.ˈβle/',
        pronunciation: 'ah-BLEH',
        tip: 'Acento en la última sílaba, "é" cerrada',
        audioKey: 'hable'
      },
      { 
        verb: 'comer', 
        form: 'comió',
        ipa: '/ko.ˈmjo/',
        pronunciation: 'ko-MEE-oh',
        tip: 'Acento en "ió", pronunciar las tres vocales',
        audioKey: 'comio'
      },
      { 
        verb: 'vivir', 
        form: 'viviste',
        ipa: '/bi.ˈβis.te/',
        pronunciation: 'bee-VEES-teh',
        tip: 'Acento en "vis", "e" final clara',
        audioKey: 'viviste'
      },
      { 
        verb: 'ir', 
        form: 'fue',
        ipa: '/ˈfwe/',
        pronunciation: 'FWEH',
        tip: 'Diptongo "ue", una sola sílaba',
        audioKey: 'fue'
      }
    ]
  },
  impf: {
    title: 'Pronunciación - Imperfecto',
    verbs: [
      { 
        verb: 'hablar', 
        form: 'hablaba',
        ipa: '/a.ˈβla.βa/',
        pronunciation: 'ah-BLAH-bah',
        tip: 'Ambas "b" son suaves, acento en "bla"',
        audioKey: 'hablaba'
      },
      { 
        verb: 'tener', 
        form: 'tenía',
        ipa: '/te.ˈni.a/',
        pronunciation: 'teh-NEE-ah',
        tip: 'Tres sílabas separadas, acento en "ní"',
        audioKey: 'tenia'
      },
      { 
        verb: 'ser', 
        form: 'era',
        ipa: '/ˈe.ɾa/',
        pronunciation: 'EH-rah',
        tip: 'R suave, no fuerte',
        audioKey: 'era'
      }
    ]
  },
  fut: {
    title: 'Pronunciación - Futuro',
    verbs: [
      { 
        verb: 'hablar', 
        form: 'hablaré',
        ipa: '/a.βla.ˈɾe/',
        pronunciation: 'ah-blah-REH',
        tip: 'Acento en la última sílaba, "é" cerrada',
        audioKey: 'hablare'
      },
      { 
        verb: 'tener', 
        form: 'tendrás',
        ipa: '/ten.ˈdɾas/',
        pronunciation: 'ten-DRAHS',
        tip: 'Grupo consonántico "ndr", acento en "drás"',
        audioKey: 'tendras'
      },
      { 
        verb: 'hacer', 
        form: 'hará',
        ipa: '/a.ˈɾa/',
        pronunciation: 'ah-RAH',
        tip: 'R fuerte, acento en la "á"',
        audioKey: 'hara'
      }
    ]
  }
};

// Función para crear síntesis de voz básica (fallback si no hay archivos de audio)
const speakText = (text, lang = 'es-ES') => {
  if ('speechSynthesis' in window) {
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8; // Hablar más lento para aprendizaje
      
      // Try to find a Spanish voice
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.startsWith('es') || voice.lang.includes('Spanish')
      );
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    };
    
    // Check if voices are loaded, if not wait for them
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
      // Fallback timeout in case voiceschanged doesn't fire
      setTimeout(speakOnce, 1000);
    } else {
      speak();
    }
  }
};

function PronunciationPractice({ tense, onBack, onContinue }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState(null);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const audioRef = useRef(null);

  const exerciseData = tense ? pronunciationData[tense.tense] : null;
  const currentVerb = exerciseData?.verbs[currentIndex];

  if (!exerciseData || !currentVerb) {
    return (
      <div className="App">
        <div className="main-content">
          <div className="pronunciation-container">
            <div className="drill-header">
              <button onClick={onBack} className="back-to-menu-btn">
                <img src="/back.png" alt="Volver" className="back-icon" />
                Volver
              </button>
              <h2>Práctica de Pronunciación</h2>
            </div>
            <p>No hay datos de pronunciación disponibles para este tiempo verbal.</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePlayAudio = () => {
    // Intentar reproducir audio pregrabado primero
    const audioFile = `/audio/spanish/${currentVerb.audioKey}.mp3`;
    
    if (audioRef.current) {
      audioRef.current.src = audioFile;
      audioRef.current.play().catch((error) => {
        // Si no hay archivo de audio, usar síntesis de voz como fallback
        console.log('Audio file not found, using text-to-speech fallback:', error.message);
        speakText(currentVerb.form);
      });
    } else {
      // Fallback directo a síntesis de voz
      console.log('Audio element not available, using text-to-speech');
      speakText(currentVerb.form);
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingResult(null);
      
      // Simular grabación (en una implementación real usarías Web Speech API)
      setTimeout(() => {
        setIsRecording(false);
        // Simular resultado de reconocimiento
        const accuracy = Math.random() * 40 + 60; // 60-100%
        setRecordingResult({
          accuracy: Math.round(accuracy),
          feedback: accuracy > 80 ? '¡Excelente pronunciación!' : 
                   accuracy > 70 ? 'Muy bien, sigue practicando' :
                   'Intenta enfocarte en la acentuación'
        });
      }, 3000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      setRecordingResult({
        accuracy: 0,
        feedback: 'No se pudo acceder al micrófono. Inténtalo de nuevo.'
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < exerciseData.verbs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRecordingResult(null);
      setShowPronunciation(false);
    } else {
      onContinue();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setRecordingResult(null);
      setShowPronunciation(false);
    }
  };

  return (
    <div className="App">
      <div className="main-content">
        <div className="pronunciation-container">
          <div className="drill-header">
            <button onClick={onBack} className="back-to-menu-btn">
              <img src="/back.png" alt="Volver" className="back-icon" />
              Volver
            </button>
            <h2>{exerciseData.title}</h2>
          </div>

          <div className="progress-indicator">
            <span>{currentIndex + 1} de {exerciseData.verbs.length}</span>
          </div>

          <div className="pronunciation-card">
            <div className="verb-info">
              <h3 className="target-verb">{currentVerb.form}</h3>
              <p className="verb-infinitive">({currentVerb.verb})</p>
            </div>

            <div className="audio-section">
              <button className="play-audio-btn" onClick={handlePlayAudio}>
                <span className="audio-icon"></span>
                Escuchar pronunciación
              </button>
              <audio ref={audioRef} style={{ display: 'none' }} />
            </div>

            <div className="pronunciation-guide">
              <button 
                className="show-pronunciation-btn"
                onClick={() => setShowPronunciation(!showPronunciation)}
              >
                {showPronunciation ? 'Ocultar' : 'Mostrar'} guía de pronunciación
              </button>
              
              {showPronunciation && (
                <div className="pronunciation-details">
                  <div className="ipa-notation">
                    <label>IPA:</label>
                    <span>{currentVerb.ipa}</span>
                  </div>
                  <div className="simplified-pronunciation">
                    <label>Pronunciación:</label>
                    <span>{currentVerb.pronunciation}</span>
                  </div>
                  <div className="pronunciation-tip">
                    <label>Consejo:</label>
                    <span>{currentVerb.tip}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="recording-section">
              <button 
                className={`record-btn ${isRecording ? 'recording' : ''}`}
                onClick={handleStartRecording}
                disabled={isRecording}
              >
                <span className="mic-icon"></span>
                {isRecording ? 'Grabando...' : 'Grabar mi pronunciación'}
              </button>

              {recordingResult && (
                <div className={`recording-result ${recordingResult.accuracy > 70 ? 'good' : 'needs-work'}`}>
                  <div className="accuracy-score">
                    Precisión: {recordingResult.accuracy}%
                  </div>
                  <div className="feedback">
                    {recordingResult.feedback}
                  </div>
                </div>
              )}
            </div>

            <div className="navigation-buttons">
              <button 
                className="nav-btn prev-btn"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ← Anterior
              </button>
              <button 
                className="nav-btn next-btn"
                onClick={handleNext}
              >
                {currentIndex < exerciseData.verbs.length - 1 ? 'Siguiente →' : 'Continuar →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PronunciationPractice;