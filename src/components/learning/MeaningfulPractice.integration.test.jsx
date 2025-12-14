/**
 * Integration test for MeaningfulPractice SRS integration
 * Verifies that correct answers update the SRS schedule properly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import * as srs from '../../lib/progress/srs.js';
import * as userManager from '../../lib/progress/userManager/index.js';

const mockUseProgressTracking = vi.hoisted(() => vi.fn());

// Mock the SRS and user manager modules
vi.mock('../../lib/progress/srs.js');
vi.mock('../../lib/progress/userManager/index.js');
vi.mock('../../features/drill/useProgressTracking.js', () => ({
  useProgressTracking: (...args) => mockUseProgressTracking(...args)
}));

// Mock CSS imports
vi.mock('./MeaningfulPractice.css', () => ({}));

import MeaningfulPractice from './MeaningfulPractice.jsx';

describe('MeaningfulPractice SRS Integration', () => {
  const mockTense = { mood: 'indicativo', tense: 'pres' };
  const mockEligibleForms = [
    { lemma: 'despertarse', value: 'despierta', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'levantarse', value: 'levanta', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'comer', value: 'come', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'beber', value: 'bebe', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'trabajar', value: 'trabaja', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'escribir', value: 'escribe', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'cocinar', value: 'cocina', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'ver', value: 've', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'leer', value: 'lee', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'dormir', value: 'duerme', mood: 'indicativo', tense: 'pres', person: '3s' }
  ];
  const mockUserId = 'test-user-123';

  const mockOnBack = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProgressTracking.mockReset();

    // Mock user manager
    vi.mocked(userManager.getCurrentUserId).mockReturnValue(mockUserId);

    // Mock SRS updateSchedule
    vi.mocked(srs.updateSchedule).mockResolvedValue(undefined);

    // Mock useProgressTracking
    mockUseProgressTracking.mockReturnValue({
      handleResult: vi.fn().mockResolvedValue(undefined)
    });

    // Deterministic exercise selection
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockUseProgressTracking.mockReset();
  });

  it('should update SRS schedule when correct verbs are found in meaningful practice', async () => {
    render(
      <MeaningfulPractice
        tense={mockTense.tense}
        mood={mockTense.mood}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onComplete={mockOnComplete}
      />
    );

    // Find the textarea and input a correct response
    const textarea = screen.getByPlaceholderText('Escribe aquí tus respuestas...');
    const correctStory = 'Carlos se despierta temprano y se levanta contento. Luego come pan y bebe café. En la oficina trabaja con sus colegas y escribe informes. Al volver a casa cocina la cena, ve una serie, lee un libro y duerme feliz.';

    fireEvent.change(textarea, { target: { value: correctStory } });

    // Find and click the check button
    const checkButton = screen.getByText('Revisar Historia');
    fireEvent.click(checkButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(screen.getByText(/¡Excelente!/)).toBeInTheDocument();
    });

    // Verify that updateSchedule was called for the verbs detected in the routine prompts
    const expectedUpdatedForms = ['despierta', 'come', 'trabaja', 'cocina', 'lee'];
    expect(srs.updateSchedule).toHaveBeenCalledTimes(expectedUpdatedForms.length);

    const calledForms = srs.updateSchedule.mock.calls.map(call => call[1].value);
    expectedUpdatedForms.forEach((form) => {
      expect(calledForms).toContain(form);
    });
  });

  it('should not update SRS schedule when eligibleForms is not provided', async () => {
    render(
      <MeaningfulPractice
        tense={mockTense.tense}
        mood={mockTense.mood}
        eligibleForms={undefined} // No eligible forms provided
        onBack={mockOnBack}
        onComplete={mockOnComplete}
      />
    );

    const textarea = screen.getByPlaceholderText('Escribe aquí tus respuestas...');
    const correctStory = 'Carlos se despierta temprano y se levanta contento. Luego come pan y bebe café. En la oficina trabaja con sus colegas y escribe informes. Al volver a casa cocina la cena, ve una serie, lee un libro y duerme feliz.';

    fireEvent.change(textarea, { target: { value: correctStory } });

    const checkButton = screen.getByText('Revisar Historia');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/¡Excelente!/)).toBeInTheDocument();
    });

    // Verify that updateSchedule was NOT called since no eligible forms provided
    expect(srs.updateSchedule).not.toHaveBeenCalled();
  });

  it('should not update SRS schedule when verb forms are not found in eligibleForms', async () => {
    const limitedEligibleForms = [
      { lemma: 'estudiar', value: 'estudia', mood: 'indicativo', tense: 'pres', person: '3s' },
    ];

    render(
      <MeaningfulPractice
        tense={mockTense.tense}
        mood={mockTense.mood}
        eligibleForms={limitedEligibleForms}
        onBack={mockOnBack}
        onComplete={mockOnComplete}
      />
    );

    const textarea = screen.getByPlaceholderText('Escribe aquí tus respuestas...');
    // Story missing several expected verbs
    const storyWithMissingVerbs = 'Carlos come pizza y ve televisión, pero no hace mucho más.';

    fireEvent.change(textarea, { target: { value: storyWithMissingVerbs } });

    const checkButton = screen.getByText('Revisar Historia');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.queryByText(/¡Excelente!/)).not.toBeInTheDocument();
      expect(screen.getByText(/Faltan/)).toBeInTheDocument();
    });

    // Verify that updateSchedule was NOT called since verbs were not all present
    expect(srs.updateSchedule).not.toHaveBeenCalled();
  });

  it('should handle SRS update errors gracefully', async () => {
    // Mock updateSchedule to throw an error
    vi.mocked(srs.updateSchedule).mockRejectedValueOnce(new Error('SRS update failed'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MeaningfulPractice
        tense={mockTense.tense}
        mood={mockTense.mood}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onComplete={mockOnComplete}
      />
    );

    const textarea = screen.getByPlaceholderText('Escribe aquí tus respuestas...');
    const correctStory = 'Carlos se despierta temprano y se levanta contento. Luego come pan y bebe café. En la oficina trabaja con sus colegas y escribe informes. Al volver a casa cocina la cena, ve una serie, lee un libro y duerme feliz.';

    fireEvent.change(textarea, { target: { value: correctStory } });

    const checkButton = screen.getByText('Revisar Historia');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/¡Excelente!/)).toBeInTheDocument();
    });

    // Verify that the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ERROR[learning:MeaningfulPractice] Failed to update SRS schedule'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
