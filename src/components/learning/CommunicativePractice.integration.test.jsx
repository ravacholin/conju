/**
 * Integration test for CommunicativePractice SRS integration
 * Verifies that correct keyword matching updates the SRS schedule properly
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
vi.mock('./CommunicativePractice.css', () => ({}));

import CommunicativePractice from './CommunicativePractice.jsx';

describe('CommunicativePractice SRS Integration', () => {
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

    // Mock user manager
    vi.mocked(userManager.getCurrentUserId).mockReturnValue(mockUserId);

    // Mock SRS updateSchedule
    vi.mocked(srs.updateSchedule).mockResolvedValue(undefined);

    // Mock useProgressTracking returned object
    mockUseProgressTracking.mockReturnValue({
      handleResult: vi.fn().mockResolvedValue(undefined)
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockUseProgressTracking.mockReset();
  });

  it('should update SRS schedule when correct keyword is found in chat response', async () => {
    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    // Wait for initial bot message to appear
    await waitFor(() => {
      expect(screen.getByText(/Me gusta conocer la rutina/)).toBeInTheDocument();
    });

    // Find the input field and enter a response with a correct keyword
    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    const userResponse = 'Normalmente trabajo en la oficina y como en casa.';

    fireEvent.change(input, { target: { value: userResponse } });

    // Send the message
    fireEvent.keyDown(input, { key: 'Enter' });

    // Wait for the chat to process the message
    await waitFor(() => {
      expect(screen.getByText(userResponse)).toBeInTheDocument();
    });

    // Wait a bit more for async SRS operations
    await waitFor(() => {
      expect(srs.updateSchedule).toHaveBeenCalled();
    });

    // Verify that updateSchedule was called for the matched keyword
    expect(srs.updateSchedule).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        lemma: 'trabajar',
        value: 'trabajo'
      }),
      true, // correct answer
      0     // hints used
    );
  });

  it('should not update SRS schedule when eligibleForms is not provided', async () => {
    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={undefined} // No eligible forms provided
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Me gusta conocer la rutina/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    const userResponse = 'Normalmente trabajo en la oficina.';

    fireEvent.change(input, { target: { value: userResponse } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(userResponse)).toBeInTheDocument();
    });

    // Verify that updateSchedule was NOT called since no eligible forms provided
    expect(srs.updateSchedule).not.toHaveBeenCalled();
  });

  it('should not update SRS schedule when keyword is not found in eligibleForms', async () => {
    const limitedEligibleForms = [
      { lemma: 'estudiar', value: 'estudio', mood: 'indicativo', tense: 'pres', person: '1s' },
    ];

    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={limitedEligibleForms}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Me gusta conocer la rutina/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    // Use a keyword that's not in the limited eligible forms
    const userResponse = 'Normalmente trabajo en la oficina.';

    fireEvent.change(input, { target: { value: userResponse } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(userResponse)).toBeInTheDocument();
    });

    // Verify that updateSchedule was NOT called since keyword not in eligible forms
    expect(srs.updateSchedule).not.toHaveBeenCalled();
  });

  it('should handle incorrect responses by providing hints without SRS updates', async () => {
    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Me gusta conocer la rutina/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    // Provide a response that doesn't match expected keywords
    const incorrectResponse = 'Me gusta el chocolate.';

    fireEvent.change(input, { target: { value: incorrectResponse } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(incorrectResponse)).toBeInTheDocument();
    });

    // Should show a hint message
    await waitFor(() => {
      expect(screen.getByText(/Cuéntame usando verbos en presente/)).toBeInTheDocument();
    });

    // Verify that updateSchedule was NOT called for incorrect response
    expect(srs.updateSchedule).not.toHaveBeenCalled();
  });

  it('should handle SRS update errors gracefully', async () => {
    // Mock updateSchedule to throw an error
    vi.mocked(srs.updateSchedule).mockRejectedValueOnce(new Error('SRS update failed'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={mockEligibleForms}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Me gusta conocer la rutina/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    const userResponse = 'Normalmente trabajo en casa.';

    fireEvent.change(input, { target: { value: userResponse } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(userResponse)).toBeInTheDocument();
    });

    // Wait for error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update SRS schedule:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should normalize keywords to match eligibleForms values', async () => {
    // Test with accented characters to ensure normalization works
    const eligibleFormsWithAccents = [
      { lemma: 'trabajar', value: 'trabajo', mood: 'indicativo', tense: 'pres', person: '1s' },
    ];

    render(
      <CommunicativePractice
        tense={mockTense}
        eligibleForms={eligibleFormsWithAccents}
        onBack={mockOnBack}
        onFinish={mockOnFinish}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Me gusta conocer la rutina/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Escribe tu respuesta...');
    // Use a response that might have different accent normalization
    const userResponse = 'Yo trabajo mucho.';

    fireEvent.change(input, { target: { value: userResponse } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(userResponse)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(srs.updateSchedule).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          lemma: 'trabajar',
          value: 'trabajo'
        }),
        true,
        0
      );
    });
  });
});
