import { afterEach, beforeEach, describe, it } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import React from 'react'
import AppRouter from '../../components/AppRouter.jsx'
import { useSettings } from '../../state/settings.js'
import router from '../../lib/routing/Router.js'

// Helpers
const resetSettings = async () => {
  try {
    window.localStorage.clear()
  } catch {
    /* ignore */
  }
  await act(async () => {
    const s = useSettings.getState()
    useSettings.setState({
      ...s,
      level: 'A1',
      useVoseo: false,
      useTuteo: false,
      useVosotros: false,
      region: null,
      practiceMode: 'mixed',
      specificMood: null,
      specificTense: null,
      practicePronoun: null,
      verbType: 'all',
      selectedFamily: null,
      cameFromTema: false
    })
  })

  try {
    await act(async () => {
      router.navigate({ mode: 'onboarding', step: 1 }, { replace: true })
    })
  } catch {
    /* ignore */
  }
}

const chooseDialectVos = async (user) => {
  const vosBtn = await screen.findByRole('button', { name: /Seleccionar dialecto rioplatense/i })
  await act(async () => {
    await user.click(vosBtn)
  })
}

const goToPorTema = async (user) => {
  const porTema = await screen.findByText(/practicar por tema/i)
  await act(async () => {
    await user.click(porTema)
  })
}

const goToPorNivel = async (user) => {
  const porNivel = await screen.findByRole('button', { name: /practicar por nivel/i })
  await act(async () => {
    await user.click(porNivel)
  })
}

const clickBack = async (user) => {
  const back = await screen.findByRole('button', { name: /Volver/i })
  await act(async () => {
    await user.click(back)
  })
}

describe('Navegación y Back (flujo actual)', () => {
  // Simplified mock user for testing without clipboard issues
  const user = {
    click: async (element) => {
      await act(async () => {
        element.click()
      })
    }
  }

  beforeEach(async () => {
    await resetSettings()
  })

  afterEach(async () => {
    await resetSettings()
  })

  it('UI Back desde subjuntivos (paso 6) vuelve a temas (paso 5) en Por tema', async () => {
    render(<AppRouter />)

    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir subjuntivos → va a paso 6 (selección de tiempos subjuntivos)
    const subjBtn = await screen.findByRole('button', { name: /subjuntivos/i })
    await act(async () => {
      await user.click(subjBtn)
    })

    // Paso 6: ver tiempos del subjuntivo (ej. Imperfecto)
    await screen.findByRole('button', { name: /Imperfecto/i })

    // Back → vuelve a paso 5 (debe aparecer "subjuntivos")
    await clickBack(user)
    await screen.findByRole('button', { name: /subjuntivos/i })
  })

  it('Hardware Back desde subjuntivos (paso 6) vuelve a temas (paso 5)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir subjuntivos → paso 6
    const subjBtn = await screen.findByRole('button', { name: /subjuntivos/i })
    await act(async () => {
      await user.click(subjBtn)
    })
    await screen.findByRole('button', { name: /Imperfecto/i })

    // Simular hardware back
    await act(async () => {
      window.history.back()
    })

    await screen.findByRole('button', { name: /subjuntivos/i })
  })

  it('UI Back desde tipo de verbo (paso 7) vuelve a temas (paso 5)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir un tiempo directo de indicativo (ej. presente) → va a paso 7
    const presente = await screen.findByRole('button', { name: /^presente$/i })
    await act(async () => {
      await user.click(presente)
    })

    // Paso 7: opciones de tipo de verbo
    await screen.findByRole('button', { name: /Seleccionar solo verbos irregulares/i })

    // Back → vuelve a temas (debe volver a ver "presente")
    await clickBack(user)
    await screen.findByRole('button', { name: /^presente$/i })
  })

  it('Por nivel: Back desde paso 3 (niveles) vuelve a paso 2 (menú)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)

    // Paso 2: menú principal → Por nivel
    await goToPorNivel(user)

    // Paso 3: niveles (A1..C2)
    await screen.findByRole('button', { name: /Seleccionar nivel A1/i })

    // Back → paso 2 (main menu)
    await clickBack(user)
    await screen.findByRole('button', { name: /practicar por nivel/i })
  })

  it('Por nivel: Back desde paso 4 (modo práctica) vuelve a paso 3', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorNivel(user)

    const nivelC1 = await screen.findByRole('button', { name: /Seleccionar nivel C1/i })
    await act(async () => {
      await user.click(nivelC1)
    })

    // Paso 4: práctica mezclada / bloque puntual
    await screen.findByRole('button', { name: /todo mezclado/i })

    // Back → paso 3 (level selection)
    await clickBack(user)
    await screen.findByRole('button', { name: /Seleccionar nivel A1/i })
  })

  it('Por nivel (specific): Back desde paso 5 (mood sin elegir) vuelve a paso 4', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorNivel(user)

    const nivelB1 = await screen.findByRole('button', { name: /Seleccionar nivel B1/i })
    await user.click(nivelB1)

    // Paso 4: elegir "un bloque puntual"
    const especificas = await screen.findByRole('button', { name: /un bloque puntual/i })
    await user.click(especificas)

    // Paso 5: selección de modo (Indicativo/Subjuntivo...)
    await screen.findByRole('button', { name: /indicativo/i })

    // Back → paso 4
    await clickBack(user)
    await screen.findByRole('button', { name: /todo mezclado/i })
  })

  it('Por tema (no finitas): submenu abre y Back desde paso 7 vuelve a paso 5', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir "formas no finitas" → activa el submenú
    const noFinitas = await screen.findByRole('button', { name: /formas no finitas/i })
    await act(async () => {
      await user.click(noFinitas)
    })

    // Submenú de formas no finitas: elegir "gerundio"
    const gerundio = await screen.findByRole('button', { name: /gerundio/i })
    await act(async () => {
      await user.click(gerundio)
    })

    // Paso 7: tipo de verbo (debería mostrar "regulares")
    await screen.findByRole('button', { name: /Seleccionar solo verbos regulares/i })

    // Back → vuelve a paso 5 (debe aparecer "formas no finitas" en el menú raíz)
    await clickBack(user)
    await screen.findByRole('button', { name: /formas no finitas/i })
  })

  it('UI Atrás retrocede exactamente un paso en el historial de onboarding', async () => {
    render(<AppRouter />)

    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir subjuntivos → paso 6
    const subjBtn = await screen.findByRole('button', { name: /subjuntivos/i })
    await act(async () => {
      await user.click(subjBtn)
    })

    await screen.findByRole('button', { name: /Imperfecto/i })
    await waitFor(() => {
      expect(router.getCurrentRoute().step).toBe(6)
    })

    const previous = router.getCurrentRoute().step

    await clickBack(user)

    await waitFor(() => {
      expect(router.getCurrentRoute().step).toBe(previous - 1)
    })

    await screen.findByRole('button', { name: /subjuntivos/i })
  })

  it('Evento popstate retrocede exactamente un paso en el historial de onboarding', async () => {
    render(<AppRouter />)

    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir subjuntivos → paso 6
    const subjBtn = await screen.findByRole('button', { name: /subjuntivos/i })
    await act(async () => {
      await user.click(subjBtn)
    })

    await screen.findByRole('button', { name: /Imperfecto/i })
    await waitFor(() => {
      expect(router.getCurrentRoute().step).toBe(6)
    })

    const previous = router.getCurrentRoute().step

    await act(async () => {
      const targetStep = previous - 1
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { appNav: true, mode: 'onboarding', step: targetStep }
      }))
    })

    await waitFor(() => {
      expect(router.getCurrentRoute().step).toBe(previous - 1)
    })

    await screen.findByRole('button', { name: /subjuntivos/i })
  })
})
