import { afterEach, beforeEach, describe, /* expect, */ it } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import React from 'react'
import AppRouter from '../../components/AppRouter.jsx'
import { useSettings } from '../../state/settings.js'
import router from '../../lib/routing/Router.js'

// Helpers
const resetSettings = () => {
  try {
    window.localStorage.clear()
  } catch {
    /* ignore */
  }
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

  try {
    router.navigate({ mode: 'onboarding', step: 1 }, { replace: true })
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
  const porTema = await screen.findByText(/TEMAS/i)
  await act(async () => {
    await user.click(porTema)
  })
}

const chooseMood = async (user, moodLabel) => {
  const moodBtn = await screen.findByRole('button', { name: new RegExp(moodLabel, 'i') })
  await act(async () => {
    await user.click(moodBtn)
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
      act(() => {
        element.click()
      })
    }
  }

  beforeEach(() => {
    resetSettings()
  })

  afterEach(() => {
    resetSettings()
  })

  it('UI Back desde tiempos (paso 6) vuelve a modos (paso 5) en Por tema', async () => {
    render(<AppRouter />)

    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir modo
    await chooseMood(user, 'Indicativo')

    // Paso 6: ver tiempos (ej. Presente)
    await screen.findByRole('button', { name: /Presente/i })

    // Back → vuelve a modos (debe aparecer "Indicativo")
    await clickBack(user)
    await screen.findByRole('button', { name: /Indicativo/i })
  })

  it('Hardware Back desde tiempos (paso 6) vuelve a modos (paso 5)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorTema(user)
    await chooseMood(user, 'Indicativo')
    await screen.findByRole('button', { name: /Presente/i })

    // Simular hardware back
    await act(async () => {
      window.history.back()
    })

    await screen.findByRole('button', { name: /Indicativo/i })
  })

  it('UI Back desde tipo de verbo (paso 7) vuelve a tiempos (paso 6)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorTema(user)
    await chooseMood(user, 'Indicativo')

    // Paso 6: elegir un tiempo para ir al paso 7
    const presente = await screen.findByRole('button', { name: /Presente/i })
    await act(async () => {
      await user.click(presente)
    })

    // Paso 7: opciones de tipo de verbo
    await screen.findByRole('button', { name: /Seleccionar solo verbos irregulares/i })

    // Back → vuelve a tiempos (debe volver a ver "Presente")
    await clickBack(user)
    await screen.findByRole('button', { name: /Presente/i })
  })

  it('Por nivel: Back desde paso 3 (niveles) vuelve a paso 2 (menú)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)

    // Paso 2: menú principal (Por nivel / Por tema)
    const porNivel = await screen.findByText(/NIVELES/i)
    await act(async () => {
      await user.click(porNivel)
    })

    // Paso 3: niveles (A1..C2)
    await screen.findByRole('button', { name: /Seleccionar nivel A1/i })

    // Back → paso 2 (main menu with level selector still active)
    await clickBack(user)
    await screen.findByText(/Volver al menú: Por tema \/ Por nivel/i)
  })

  it('Por nivel: Back desde paso 4 (modo práctica) vuelve a paso 2', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    const porNivel = await screen.findByText(/NIVELES/i)
    await act(async () => {
      await user.click(porNivel)
    })
    const nivelC1 = await screen.findByRole('button', { name: /Seleccionar nivel C1/i })
    await act(async () => {
      await user.click(nivelC1)
    })

    // Paso 4: práctica mixta/específica
    await screen.findByText(/MIXTA/i)

    // Back → paso 2 (level selection)
    await clickBack(user)
    await screen.findByText(/A1/i)
  })

  it('Por nivel (specific): Back desde paso 5 (mood sin elegir) vuelve a paso 4', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    const porNivel = await screen.findByText(/NIVELES/i)
    await user.click(porNivel)
    const nivelB1 = await screen.findByRole('button', { name: /Seleccionar nivel B1/i })
    await user.click(nivelB1)

    // Paso 4: elegir "Formas Específicas"
    const especificas = await screen.findByText(/ESPECÍFICA/i)
    await user.click(especificas)

    // Paso 5: selección de modo (Indicativo/Subjuntivo...)
    await screen.findByRole('button', { name: /Indicativo/i })

    // Back → paso 4
    await clickBack(user)
    await screen.findByText(/MIXTA/i)
  })

  it('Por tema (no finitas): Back desde paso 6 (Gerundio sin tiempo elegido) vuelve a paso 5 (moods)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    await goToPorTema(user)

    // Paso 5: elegir "Formas no conjugadas"
    const noConjugadas = await screen.findByRole('button', { name: /Formas no conjugadas/i })
    await user.click(noConjugadas)

    // Paso 6: elegir "Gerundio"
    const gerundio = await screen.findByRole('button', { name: /Gerundio/i })
    await user.click(gerundio)

    // Back → vuelve a paso 5 (debe aparecer "Formas no conjugadas")
    await clickBack(user)
    await screen.findByRole('button', { name: /Formas no conjugadas/i })
  })

  it('UI Atrás retrocede exactamente un paso en el historial de onboarding', async () => {
    render(<AppRouter />)

    await chooseDialectVos(user)
    await goToPorTema(user)
    await chooseMood(user, 'Indicativo')

    await screen.findByRole('button', { name: /Presente/i })
    await waitFor(() => {
      expect(router.getCurrentRoute().step).toBe(6)
    })

    const previous = router.getCurrentRoute().step

    await clickBack(user)

    await waitFor(() => {
      expect(router.getCurrentRoute().step).toBe(previous - 1)
    })

    await screen.findByRole('button', { name: /Indicativo/i })
  })

  it('Evento popstate retrocede exactamente un paso en el historial de onboarding', async () => {
    render(<AppRouter />)

    await chooseDialectVos(user)
    await goToPorTema(user)
    await chooseMood(user, 'Indicativo')

    await screen.findByRole('button', { name: /Presente/i })
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

    await screen.findByRole('button', { name: /Indicativo/i })
  })
})
