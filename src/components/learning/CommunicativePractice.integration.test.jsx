import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import * as srs from '../../lib/progress/srs.js';
import * as userManager from '../../lib/progress/userManager.js';

const mockUseProgressTracking = vi.hoisted(() => vi.fn());

vi.mock('../../lib/progress/srs.js');
vi.mock('../../lib/progress/userManager.js');
vi.mock('../../features/drill/useProgressTracking.js', () => ({
  useProgressTracking: (...args) => mockUseProgressTracking(...args),
}));

vi.mock('./CommunicativePractice.css', () => ({}));

import CommunicativePractice from './CommunicativePractice.jsx';

describe('CommunicativePractice integration', () => {
  const mockTense = { mood: 'indicativo', tense: 'pres' };
  const mockEligibleForms = [
    { lemma: 'trabajar', value: 'trabajo', mood: 'indicativo', tense: 'pres', person: '1s' },
    { lemma: 'comer', value: 'como', mood: 'indicativo', tense: 'pres', person: '1s' },
    { lemma: 'vivir', value: 'vivo', mood: 'indicativo', tense: 'pres', person: '1s' },
    { lemma: 'hacer', value: 'hago', mood: 'indicativo', tense: 'pres', person: '1s' },
  ];
  const mockUserId = 'test-user-123';

  const mockOnBack = vi.fn();
  const mockOnFinish = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProgressTracking.mockReset();

    vi.mocked(userManager.getCurrentUserId).mockReturnValue(mockUserId);
    vi.mocked(srs.updateSchedule).mockResolvedValue(undefined);
    mockUseProgressTracking.mockReturnValue({
      handleResult: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockUseProgressTracking.mockReset();
  });

  function startConversation() {
    const startButton = screen.getByRole('button', { name: /comenzar conversación/i });
    fireEvent.click(startButton);
  }

  it('progresses through the scenario and updates SRS for matched eligible forms', async () => {
    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/rutina conectada/i)).toBeInTheDocument();
    });

    startConversation();

    await waitFor(() => {
      expect(screen.getByText(/Contame qué hacés en un día típico/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');

    fireEvent.change(input, { target: { value: 'Trabajo y como en casa todos los días.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/¡Genial!/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/¿Qué hacés para relajarte/i)).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: 'Vivo con mis amigos y hago ejercicio con ellos.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/¿Con quién compartís parte de esas actividades\?/i)).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: 'Salimos juntos y mis amigos trabajan conmigo.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cierre reflexivo/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(srs.updateSchedule).toHaveBeenCalledTimes(4);
    });

    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ lemma: 'trabajar', value: 'trabajo' }),
      true,
      0,
      expect.objectContaining({ evaluation: 'full' })
    );
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ lemma: 'comer', value: 'como' }),
      true,
      0,
      expect.objectContaining({ evaluation: 'full' })
    );
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ lemma: 'vivir', value: 'vivo' }),
      true,
      0,
      expect.objectContaining({ evaluation: 'full' })
    );
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ lemma: 'hacer', value: 'hago' }),
      true,
      0,
      expect.objectContaining({ evaluation: 'full' })
    );
  });

  it('does not update SRS when eligible forms are absent', async () => {
    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={[]}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/rutina conectada/i)).toBeInTheDocument();
    });

    startConversation();

    fireEvent.change(screen.getByPlaceholderText('Escribe tu respuesta...'), {
      target: { value: 'Trabajo en casa y cocino para mi familia.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/¿Qué hacés para relajarte/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Escribe tu respuesta...'), {
      target: { value: 'Descanso y salgo con amigos.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/¿Con quién compartís parte de esas actividades\?/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Escribe tu respuesta...'), {
      target: { value: 'Salimos en familia los domingos.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cierre reflexivo/i)).toBeInTheDocument();
    });

    expect(vi.mocked(srs.updateSchedule)).not.toHaveBeenCalled();
  });

  it('provides formative hints when the response misses target verbs', async () => {
    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/rutina conectada/i)).toBeInTheDocument();
    });

    startConversation();

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    fireEvent.change(input, { target: { value: 'Me gusta el chocolate.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Usá al menos dos verbos en presente/i)).toBeInTheDocument();
    });

    const partialCalls = vi.mocked(srs.updateSchedule).mock.calls;
    expect(partialCalls.length).toBeGreaterThan(0);
    partialCalls.forEach(call => {
      expect(call[2]).toBe(false);
      expect(call[4]).toMatchObject({ evaluation: 'partial' });
    });
  });

  it('highlights tense issues when the user switches to another tense', async () => {
    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/rutina conectada/i)).toBeInTheDocument();
    });

    startConversation();

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    fireEvent.change(input, { target: { value: 'Ayer trabajé mucho.' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Usá al menos dos verbos en presente/i)).toBeInTheDocument();
    });

    const tenseCalls = vi.mocked(srs.updateSchedule).mock.calls;
    expect(tenseCalls.length).toBeGreaterThan(0);
    tenseCalls.forEach(call => {
      expect(call[2]).toBe(false);
      expect(call[4]).toMatchObject({ evaluation: 'partial' });
    });
  });
});
