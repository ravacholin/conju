import React from 'react';
import { render, waitFor, act, cleanup } from '@testing-library/react';
import { useSettings } from '../../state/settings.js';

const {
  setCallbacksMock,
  getServiceInstance,
  setServiceInstance
} = vi.hoisted(() => {
  let mockServiceInstance;
  const setCallbacksMock = vi.fn((callbacks) => {
    if (mockServiceInstance) {
      mockServiceInstance.__callbacks = callbacks;
    }
  });

  return {
    setCallbacksMock,
    getServiceInstance: () => mockServiceInstance,
    setServiceInstance: (service) => {
      mockServiceInstance = service;
    }
  };
});

vi.mock('../../lib/pronunciation/speechRecognition.js', () => {
  class MockSpeechRecognitionService {
    constructor() {
      this.setCallbacks = setCallbacksMock;
      this.testCompatibility = vi.fn().mockResolvedValue({
        speechRecognition: true,
        microphone: true
      });
      this.initialize = vi.fn().mockResolvedValue();
      this.startListening = vi.fn().mockResolvedValue(true);
      this.stopListening = vi.fn();
      this.destroy = vi.fn();
      setServiceInstance(this);
    }
  }

  return {
    __esModule: true,
    default: MockSpeechRecognitionService
  };
});

vi.mock('../../lib/pronunciation/pronunciationAnalyzer.js', () => {
  class MockPronunciationAnalyzer {
    constructor() {
      this.analyzePronunciation = vi.fn((expected, transcript) => ({
        isCorrectForSRS: expected === transcript,
        accuracy: expected === transcript ? 100 : 0,
        pedagogicalScore: expected === transcript ? 100 : 0,
        semanticValidation: { type: 'mock' }
      }));
    }
  }

  return {
    __esModule: true,
    default: MockPronunciationAnalyzer
  };
});

vi.mock('../../lib/pronunciation/pronunciationUtils.js', async () => {
  const actual = await vi.importActual('../../lib/pronunciation/pronunciationUtils.js');
  return {
    __esModule: true,
    ...actual,
    speakText: vi.fn()
  };
});

const createItem = (form) => ({
  value: form,
  lemma: 'hablar',
  person: 'yo',
  mood: 'indicativo',
  tense: 'presente'
});

const getMockService = () => getServiceInstance();

import PronunciationPanelSafe from './PronunciationPanelSafe.jsx';

describe('PronunciationPanelSafe', () => {
  const initialRegion = useSettings.getState().region;

  beforeAll(() => {
    vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(() => cb(Date.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
  });

  beforeEach(() => {
    act(() => {
      useSettings.setState({ region: initialRegion });
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    setServiceInstance(undefined);
    act(() => {
      useSettings.setState({ region: initialRegion });
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('actualiza los callbacks cuando currentItem cambia y evalúa con la conjugación vigente', async () => {
    const handleResult = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <PronunciationPanelSafe
        currentItem={createItem('hablo')}
        handleResult={handleResult}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(getMockService()?.initialize).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(setCallbacksMock).toHaveBeenCalled();
    });

    rerender(
      <PronunciationPanelSafe
        currentItem={createItem('hablas')}
        handleResult={handleResult}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(setCallbacksMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    rerender(
      <PronunciationPanelSafe
        currentItem={createItem('habla')}
        handleResult={handleResult}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(setCallbacksMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    const service = getMockService();
    expect(service).toBeDefined();
    const callbacks = service.__callbacks;
    expect(callbacks).toBeDefined();

    await act(async () => {
      callbacks.onResult({
        isFinal: true,
        transcript: 'habla',
        confidence: 1,
        alternatives: []
      });
    });

    expect(handleResult).toHaveBeenCalled();
    const lastCall = handleResult.mock.calls.at(-1)[0];
    expect(lastCall.correctAnswer).toBe('habla');
    expect(lastCall.userAnswer).toBe('habla');
  });

  it('usa el dialecto rioplatense cuando la región es rioplatense', async () => {
    act(() => {
      useSettings.setState({ region: 'rioplatense' });
    });

    render(
      <PronunciationPanelSafe
        currentItem={createItem('hablo')}
        handleResult={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(getMockService()?.initialize).toHaveBeenCalledWith({ language: 'es-AR' });
    });

    await waitFor(() => {
      expect(getMockService()?.startListening).toHaveBeenCalledWith({ language: 'es-AR' });
    });
  });

  it('usa el dialecto peninsular cuando la región es peninsular', async () => {
    act(() => {
      useSettings.setState({ region: 'peninsular' });
    });

    render(
      <PronunciationPanelSafe
        currentItem={createItem('hablo')}
        handleResult={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(getMockService()?.initialize).toHaveBeenCalledWith({ language: 'es-ES' });
    });

    await waitFor(() => {
      expect(getMockService()?.startListening).toHaveBeenCalledWith({ language: 'es-ES' });
    });
  });
});
