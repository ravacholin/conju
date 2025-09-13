import { afterEach, beforeEach, describe, /* expect, */ it } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import AppRouter from '../../components/AppRouter.jsx'
import { useSettings } from '../../state/settings.js'

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
}

const chooseDialectVos = async (user) => {
  const vosBtn = await screen.findByRole('button', { name: /Seleccionar dialecto rioplatense/i })
  await act(async () => {
    await user.click(vosBtn)
  })
}

const goToPorTema = async (user) => {
  const porTema = await screen.findByText(/Por tema/i)
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
  const user = userEvent.setup()

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
    await screen.findByText(/Verbos Irregulares/i)

    // Back → vuelve a tiempos (debe volver a ver "Presente")
    await clickBack(user)
    await screen.findByRole('button', { name: /Presente/i })
  })

  it('Por nivel: Back desde paso 3 (niveles) vuelve a paso 2 (menú)', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)

    // Paso 2: menú principal (Por nivel / Por tema)
    const porNivel = await screen.findByText(/Por nivel/i)
    await act(async () => {
      await user.click(porNivel)
    })

    // Paso 3: niveles (A1..C2)
    await screen.findByRole('button', { name: /Seleccionar nivel A1/i })

    // Back → paso 2
    await clickBack(user)
    await screen.findByText(/Por tema/i)
  })

  it('Por nivel: Back desde paso 4 (modo práctica) vuelve a paso 2', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    const porNivel = await screen.findByText(/Por nivel/i)
    await act(async () => {
      await user.click(porNivel)
    })
    const nivelC1 = await screen.findByRole('button', { name: /Seleccionar nivel C1/i })
    await act(async () => {
      await user.click(nivelC1)
    })

    // Paso 4: práctica mixta/específica
    await screen.findByText(/Práctica Mixta/i)

    // Back → paso 2
    await clickBack(user)
    await screen.findByText(/Por tema/i)
  })

  it('Por nivel (specific): Back desde paso 5 (mood sin elegir) vuelve a paso 4', async () => {
    render(<AppRouter />)
    await chooseDialectVos(user)
    const porNivel = await screen.findByText(/Por nivel/i)
    await user.click(porNivel)
    const nivelB1 = await screen.findByRole('button', { name: /Seleccionar nivel B1/i })
    await user.click(nivelB1)

    // Paso 4: elegir "Formas Específicas"
    const especificas = await screen.findByText(/Formas Específicas/i)
    await user.click(especificas)

    // Paso 5: selección de modo (Indicativo/Subjuntivo...)
    await screen.findByRole('button', { name: /Indicativo/i })

    // Back → paso 4
    await clickBack(user)
    await screen.findByText(/Práctica Mixta/i)
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
})
