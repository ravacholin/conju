/**
 * Integration test for MeaningfulPractice SRS integration
 * Verifies that correct answers update the SRS schedule properly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import * as srs from '../../lib/progress/srs.js';
import * as userManager from '../../lib/progress/userManager.js';

const mockUseProgressTracking = vi.hoisted(() => vi.fn());

// Mock the SRS and user manager modules
vi.mock('../../lib/progress/srs.js');
vi.mock('../../lib/progress/userManager.js');
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
  const mockOnPhaseComplete = vi.fn();

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
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onPhaseComplete={mockOnPhaseComplete}
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
        tense={mockTense}
        eligibleForms={undefined} // No eligible forms provided
        onBack={mockOnBack}
        onPhaseComplete={mockOnPhaseComplete}
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
        tense={mockTense}
        eligibleForms={limitedEligibleForms}
        onBack={mockOnBack}
        onPhaseComplete={mockOnPhaseComplete}
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
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onPhaseComplete={mockOnPhaseComplete}
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
      'Failed to update SRS schedule:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should normalize accents and casing for prompts-based exercises', async () => {
    const futTense = { mood: 'indicativo', tense: 'fut' };
    const futEligibleForms = [
      { lemma: 'viajar', value: 'viajaré', mood: 'indicativo', tense: 'fut', person: '1s' },
      { lemma: 'descansar', value: 'descansaré', mood: 'indicativo', tense: 'fut', person: '1s' },
      { lemma: 'trabajar', value: 'trabajaré', mood: 'indicativo', tense: 'fut', person: '1s' },
      { lemma: 'tener', value: 'tendré', mood: 'indicativo', tense: 'fut', person: '1s' },
    ];

    render(
      <MeaningfulPractice
        tense={futTense}
        eligibleForms={futEligibleForms}
        onBack={mockOnBack}
        onPhaseComplete={mockOnPhaseComplete}
      />
    );

    const textarea = screen.getByPlaceholderText('Escribe aquí tus respuestas...');
    const response = 'VIAJARE por el mundo y CONOCERE nuevas culturas. EN MIS PROXIMAS VACACIONES DESCANSARE junto al mar. ' +
      'CUANDO TERMINE MIS ESTUDIOS TRABAJARE duro y SERE feliz. EN EL FUTURO TENDRE mi propia empresa y HARE lo que amo.';

    fireEvent.change(textarea, { target: { value: response } });
    fireEvent.click(screen.getByText('Revisar Historia'));

    await waitFor(() => {
      expect(screen.getByText(/¡Excelente!/)).toBeInTheDocument();
    });

    const calledForms = srs.updateSchedule.mock.calls.map(call => call[1].value);
    expect(calledForms).toEqual(expect.arrayContaining(['viajaré', 'descansaré', 'trabajaré', 'tendré']));
  });

  it('should register every canonical synonym as missing when prompts are skipped', async () => {
    const synonymsEligibleForms = [
      { lemma: 'descansar', value: 'descanse', mood: 'subjuntivo', tense: 'subjPres', person: '3s' },
      { lemma: 'dormir', value: 'duerma', mood: 'subjuntivo', tense: 'subjPres', person: '3s' },
      { lemma: 'practicar', value: 'practique', mood: 'subjuntivo', tense: 'subjPres', person: '3s' },
      { lemma: 'estudiar', value: 'estudie', mood: 'subjuntivo', tense: 'subjPres', person: '3s' },
      { lemma: 'disfrutar', value: 'disfruten', mood: 'subjuntivo', tense: 'subjPres', person: '3p' },
      { lemma: 'viajar', value: 'viajen', mood: 'subjuntivo', tense: 'subjPres', person: '3p' },
    ];

    render(
      <MeaningfulPractice
        tense={{ mood: 'subjuntivo', tense: 'subjPres' }}
        eligibleForms={synonymsEligibleForms}
        onBack={mockOnBack}
        onPhaseComplete={mockOnPhaseComplete}
      />
    );

    const textarea = screen.getByPlaceholderText('Escribe aquí tus respuestas...');
    fireEvent.change(textarea, { target: { value: 'Recomiendo que tu amigo descanse mucho.' } });
    fireEvent.click(screen.getByText('Revisar Historia'));

    await waitFor(() => {
      expect(screen.getByText(/Faltan/)).toBeInTheDocument();
    });

    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ value: 'descanse' }),
      true,
      0
    );

    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ value: 'practique' }),
      false,
      1
    );
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ value: 'estudie' }),
      false,
      1
    );
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ value: 'disfruten' }),
      false,
      1
    );
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ value: 'viajen' }),
      false,
      1
    );
  });

  it('should render alternative variants and grade their verbs correctly', async () => {
    Math.random.mockReturnValue(0.8);

    const familyEligibleForms = [
      { lemma: 'llorar', value: 'llora', mood: 'indicativo', tense: 'pres', person: '3s' },
      { lemma: 'preparar', value: 'prepara', mood: 'indicativo', tense: 'pres', person: '3s' },
      { lemma: 'jugar', value: 'juegan', mood: 'indicativo', tense: 'pres', person: '3p' },
      { lemma: 'ver', value: 've', mood: 'indicativo', tense: 'pres', person: '3s' },
      { lemma: 'correr', value: 'corre', mood: 'indicativo', tense: 'pres', person: '3s' },
    ];

    render(
      <MeaningfulPractice
        tense={mockTense}
        eligibleForms={familyEligibleForms}
        onBack={mockOnBack}
        onPhaseComplete={mockOnPhaseComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Ejercicio temático: family life/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('Escribe aquí tus respuestas...');
    const thematicStory = 'En casa el bebé llora por las noches, papá prepara la cena y los niños juegan en el salón. ' +
      'La abuela ve sus novelas mientras el perro corre en el jardín.';

    fireEvent.change(textarea, { target: { value: thematicStory } });
    fireEvent.click(screen.getByText('Revisar Historia'));

    await waitFor(() => {
      expect(screen.getByText(/¡Excelente!/)).toBeInTheDocument();
    });

    const updatedValues = srs.updateSchedule.mock.calls.map(call => call[1].value);
    expect(updatedValues).toEqual(expect.arrayContaining(['llora', 'prepara', 'juegan', 've', 'corre']));
  });
});
