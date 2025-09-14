import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GeneralRecommendations from './GeneralRecommendations.jsx'

describe('GeneralRecommendations', () => {
  const recommendations = [
    { title: 'Recomendación A', description: 'Desc A', priority: 1 },
    { title: 'Recomendación B', description: 'Desc B', priority: 2 },
  ]

  it('renders recommendation cards and handles click', () => {
    const onSelect = vi.fn()
    render(<GeneralRecommendations recommendations={recommendations} onSelect={onSelect} />)

    const cardA = screen.getByRole('button', { name: /Recomendación A/i })
    fireEvent.click(cardA)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(recommendations[0])
  })

  it('renders empty state when no recommendations', () => {
    render(<GeneralRecommendations recommendations={[]} onSelect={() => {}} />)
    expect(screen.getByText(/Sigue practicando/i)).toBeInTheDocument()
  })
})
