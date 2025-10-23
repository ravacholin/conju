import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import ProgressEmptyState from './ProgressEmptyState.jsx'

describe('ProgressEmptyState', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <ProgressEmptyState
        syncEnabled
        onSync={() => {}}
        onNavigateToDrill={() => {}}
        onNavigateHome={() => {}}
        onRefresh={() => {}}
        systemReady
      />
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('disables sync button when syncing or sync disabled', () => {
    const onSync = vi.fn()
    const { rerender } = render(
      <ProgressEmptyState
        syncEnabled={false}
        syncing={false}
        onSync={onSync}
        onNavigateToDrill={() => {}}
        systemReady
      />
    )

    const syncButton = screen.getByRole('button', { name: /sincronizar progreso/i })
    expect(syncButton).toBeDisabled()

    rerender(
      <ProgressEmptyState
        syncEnabled
        syncing
        onSync={onSync}
        onNavigateToDrill={() => {}}
        systemReady
      />
    )

    expect(screen.getByRole('button', { name: /sincronizando/i })).toBeDisabled()
  })

  it('invokes handlers when actions are clicked', () => {
    const onSync = vi.fn()
    const onPractice = vi.fn()
    const onRefresh = vi.fn()
    const onHome = vi.fn()

    render(
      <ProgressEmptyState
        syncEnabled
        onSync={onSync}
        onNavigateToDrill={onPractice}
        onRefresh={onRefresh}
        onNavigateHome={onHome}
        systemReady
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /iniciar práctica/i }))
    fireEvent.click(screen.getByRole('button', { name: /sincronizar progreso/i }))
    fireEvent.click(screen.getByRole('button', { name: /reintentar carga/i }))
    fireEvent.click(screen.getByRole('button', { name: /volver al inicio/i }))

    expect(onPractice).toHaveBeenCalledTimes(1)
    expect(onSync).toHaveBeenCalledTimes(1)
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(onHome).toHaveBeenCalledTimes(1)
  })
})
