import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';

let meaningfulProps = null;
let communicativeProps = null;

vi.mock('./TenseSelectionStep.jsx', () => ({
  __esModule: true,
  default: ({ onSelect }) => {
    React.useEffect(() => {
      onSelect('indicativo', 'pres');
    }, [onSelect]);
    return null;
  }
}));

vi.mock('./TypeSelectionStep.jsx', () => ({
  __esModule: true,
  default: ({ onSelectType }) => {
    React.useEffect(() => {
      onSelectType('regular', []);
    }, [onSelectType]);
    return null;
  }
}));

vi.mock('./DurationSelectionStep.jsx', () => ({
  __esModule: true,
  default: () => null
}));

vi.mock('./NarrativeIntroduction.jsx', () => ({
  __esModule: true,
  default: ({ onContinue }) => {
    React.useEffect(() => {
      onContinue?.();
    }, [onContinue]);
    return null;
  }
}));

vi.mock('./EndingsDrill.jsx', () => ({
  __esModule: true,
  default: ({ onComplete }) => {
    React.useEffect(() => {
      onComplete?.();
    }, [onComplete]);
    return null;
  }
}));

vi.mock('./LearningDrill.jsx', () => ({
  __esModule: true,
  default: ({ onPhaseComplete }) => {
    React.useEffect(() => {
      onPhaseComplete?.();
    }, [onPhaseComplete]);
    return null;
  }
}));

vi.mock('./PronunciationPractice.jsx', () => ({
  __esModule: true,
  default: ({ onContinue }) => {
    React.useEffect(() => {
      onContinue?.();
    }, [onContinue]);
    return null;
  }
}));

vi.mock('../../lib/learning/adaptiveEngine.js', () => ({
  __esModule: true,
  calculateAdaptiveDifficulty: vi.fn().mockReturnValue({
    level: 'beginner',
    practiceIntensity: 'low',
    skipIntroduction: false,
    extendedPractice: true,
    hintsEnabled: true
  }),
  personalizeSessionDuration: vi.fn().mockReturnValue({ totalDuration: 300000, phases: {} }),
  canSkipPhase: vi.fn().mockReturnValue(false)
}));

vi.mock('./MeaningfulPractice.jsx', () => ({
  __esModule: true,
  default: (props) => {
    meaningfulProps = props;
    return <div data-testid="meaningful-mock" />;
  }
}));

vi.mock('./CommunicativePractice.jsx', () => ({
  __esModule: true,
  default: (props) => {
    communicativeProps = props;
    return <div data-testid="communicative-mock" />;
  }
}));

vi.mock('./IrregularRootDrill.jsx', () => ({
  __esModule: true,
  default: () => null
}));

vi.mock('./NonfiniteGuidedDrill.jsx', () => ({
  __esModule: true,
  default: () => null
}));

const LearnTenseFlow = (await import('./LearnTenseFlow.jsx')).default;

describe('LearnTenseFlow eligibleForms propagation', () => {
  beforeEach(() => {
    meaningfulProps = null;
    communicativeProps = null;
  });

  it('passes computed eligibleForms to meaningful and communicative phases', async () => {
    render(<LearnTenseFlow onHome={() => {}} onGoToProgress={() => {}} />);

    await waitFor(() => {
      expect(meaningfulProps).not.toBeNull();
    });

    expect(Array.isArray(meaningfulProps.eligibleForms)).toBe(true);
    expect(meaningfulProps.eligibleForms.length).toBeGreaterThan(0);
    expect(meaningfulProps.eligibleForms.every(form => form.tense === 'pres')).toBe(true);

    await act(async () => {
      meaningfulProps.onPhaseComplete?.();
    });

    await waitFor(() => {
      expect(communicativeProps).not.toBeNull();
    });

    expect(communicativeProps.eligibleForms).toEqual(meaningfulProps.eligibleForms);
  });
});
