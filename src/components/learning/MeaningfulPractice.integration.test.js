/**
 * Integration test for MeaningfulPractice SRS integration
 * Verifies that correct answers update the SRS schedule properly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MeaningfulPractice from './MeaningfulPractice.jsx';
import * as srs from '../../lib/progress/srs.js';
import * as userManager from '../../lib/progress/userManager.js';

// Mock the SRS and user manager modules
vi.mock('../../lib/progress/srs.js');
vi.mock('../../lib/progress/userManager.js');
vi.mock('../../features/drill/useProgressTracking.js');

// Mock CSS imports
vi.mock('./MeaningfulPractice.css', () => ({}));

describe('MeaningfulPractice SRS Integration', () => {
  const mockTense = { mood: 'indicativo', tense: 'pres' };
  const mockEligibleForms = [
    { lemma: 'hablar', value: 'habla', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'comer', value: 'come', mood: 'indicativo', tense: 'pres', person: '3s' },
    { lemma: 'vivir', value: 'vive', mood: 'indicativo', tense: 'pres', person: '3s' },
  ];
  const mockUserId = 'test-user-123';

  const mockOnBack = vi.fn();
  const mockOnPhaseComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user manager
    vi.mocked(userManager.getCurrentUserId).mockReturnValue(mockUserId);

    // Mock SRS updateSchedule
    vi.mocked(srs.updateSchedule).mockResolvedValue(undefined);

    // Mock useProgressTracking
    const mockUseProgressTracking = vi.fn(() => ({
      handleResult: vi.fn().mockResolvedValue(undefined)
    }));
    vi.doMock('../../features/drill/useProgressTracking.js', () => ({
      useProgressTracking: mockUseProgressTracking
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    const correctStory = 'Carlos habla español. Come pizza todos los días. Vive en Madrid.';

    fireEvent.change(textarea, { target: { value: correctStory } });

    // Find and click the check button
    const checkButton = screen.getByText('Revisar Historia');
    fireEvent.click(checkButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(screen.getByText(/¡Excelente!/)).toBeInTheDocument();
    });

    // Verify that updateSchedule was called for each found verb form
    expect(srs.updateSchedule).toHaveBeenCalledTimes(3);

    // Verify specific calls
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ lemma: 'hablar', value: 'habla' }),
      true, // correct answer
      0     // hints used
    );

    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ lemma: 'comer', value: 'come' }),
      true,
      0
    );

    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({ lemma: 'vivir', value: 'vive' }),
      true,
      0
    );
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
    const correctStory = 'Carlos habla español. Come pizza todos los días.';

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
    // Use verbs that are not in the limited eligible forms
    const storyWithUnknownVerbs = 'Carlos habla español. Come pizza todos los días.';

    fireEvent.change(textarea, { target: { value: storyWithUnknownVerbs } });

    const checkButton = screen.getByText('Revisar Historia');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText(/¡Excelente!/)).toBeInTheDocument();
    });

    // Verify that updateSchedule was NOT called since verbs were not in eligible forms
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
    const correctStory = 'Carlos habla español.';

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
});