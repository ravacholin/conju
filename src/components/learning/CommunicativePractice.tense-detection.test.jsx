import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import CommunicativePractice, { detectTenseUsage } from './CommunicativePractice.jsx';
import { ERROR_TAGS } from '../../lib/progress/dataModels.js';
import * as srs from '../../lib/progress/srs.js';
import * as userManager from '../../lib/progress/userManager/index.js';

const mockUseProgressTracking = vi.hoisted(() => vi.fn());
const mockHandleResult = vi.hoisted(() => vi.fn());

vi.mock('../../lib/progress/srs.js');
vi.mock('../../lib/progress/userManager/index.js');
vi.mock('../../features/drill/useProgressTracking.js', () => ({
  useProgressTracking: (...args) => mockUseProgressTracking(...args)
}));
vi.mock('./CommunicativePractice.css', () => ({}));

const noop = () => {};

const TENSE_MOODS = {
  subjPres: 'subjuntivo',
  cond: 'condicional',
  plusc: 'indicativo',
  futPerf: 'indicativo',
  subjImpf: 'subjuntivo',
  condPerf: 'condicional',
  subjPerf: 'subjuntivo',
  subjPlusc: 'subjuntivo'
};

describe('CommunicativePractice tense detection error tagging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleResult.mockReset();
    mockHandleResult.mockResolvedValue(undefined);
    mockUseProgressTracking.mockReset();
    mockUseProgressTracking.mockReturnValue({ handleResult: mockHandleResult });
    vi.mocked(userManager.getCurrentUserId).mockReturnValue('test-user');
    vi.mocked(srs.updateSchedule).mockResolvedValue(undefined);
  });

  const wrongResponses = [
    { tense: 'subjPres', response: 'Trabajo y estudio mucho en casa.' },
    { tense: 'cond', response: 'Fui al cine ayer y comi palomitas.' },
    { tense: 'plusc', response: 'He terminado el proyecto esta manana.' },
    { tense: 'futPerf', response: 'Trabajare en la oficina manana.' },
    { tense: 'subjImpf', response: 'Trabajo cuando puedo y estudio despues.' },
    { tense: 'condPerf', response: 'Trabajaria desde casa todos los dias.' },
    { tense: 'subjPerf', response: 'He terminado el informe esta tarde.' },
    { tense: 'subjPlusc', response: 'Habia terminado todo antes de salir.' }
  ];

  it.each(wrongResponses)(
    'marshals WRONG_TENSE_USED for $tense when response is $response',
    async ({ tense, response }) => {
      render(
        <CommunicativePractice
          tense={{ mood: TENSE_MOODS[tense], tense }}
          eligibleForms={[]}
          onBack={noop}
          onFinish={noop}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Escribe tu respuesta...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Escribe tu respuesta...');
      fireEvent.change(input, { target: { value: response } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockHandleResult).toHaveBeenCalled();
      });

      const lastCall = mockHandleResult.mock.calls.at(-1)[0];
      expect(lastCall.correct).toBe(false);
      expect(lastCall.errorTags).toContain(ERROR_TAGS.WRONG_TENSE_USED);
      expect(lastCall.errorTags).toContain(`expected_${tense}`);
    }
  );

  it('detects future perfect usage without accents', () => {
    const analysis = detectTenseUsage('Para entonces habre terminado el proyecto.', 'futPerf');
    expect(analysis.hasExpectedTense).toBe(true);
    expect(analysis.wrongTenseUsed).toBe(false);
  });
});
