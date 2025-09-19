import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'

vi.mock('../../lib/data/simplifiedFamilyGroups.js', () => {
  return {
    getSimplifiedGroupsForMood: vi.fn(),
    getSimplifiedGroupsForTense: vi.fn(),
    shouldUseSimplifiedGroupingForMood: vi.fn(),
    shouldUseSimplifiedGrouping: vi.fn()
  }
})

import FamilySelection from './FamilySelection.jsx'
import {
  getSimplifiedGroupsForMood,
  getSimplifiedGroupsForTense,
  shouldUseSimplifiedGroupingForMood,
  shouldUseSimplifiedGrouping
} from '../../lib/data/simplifiedFamilyGroups.js'

describe('FamilySelection auto-selection behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldUseSimplifiedGrouping.mockReturnValue(false)
    shouldUseSimplifiedGroupingForMood.mockReturnValue(false)
    getSimplifiedGroupsForMood.mockReturnValue([])
    getSimplifiedGroupsForTense.mockReturnValue([])
  })

  it('auto selects all families for irregular compound tenses in mixed mode', async () => {
    const onSelectFamily = vi.fn()

    render(React.createElement(FamilySelection, {
      settings: {
        verbType: 'irregular',
        level: 'B1',
        practiceMode: 'mixed',
        specificTense: 'plusc'
      },
      onSelectFamily,
      onBack: vi.fn()
    }))

    await waitFor(() => {
      expect(onSelectFamily).toHaveBeenCalledWith(null)
    })
  })

  it('auto selects when simplified groups for a tense are empty', async () => {
    shouldUseSimplifiedGrouping.mockReturnValue(true)
    getSimplifiedGroupsForTense.mockReturnValue([])

    const onSelectFamily = vi.fn()

    render(React.createElement(FamilySelection, {
      settings: {
        verbType: 'irregular',
        specificTense: 'present'
      },
      onSelectFamily,
      onBack: vi.fn()
    }))

    await waitFor(() => {
      expect(onSelectFamily).toHaveBeenCalledWith(null)
    })
  })
})
