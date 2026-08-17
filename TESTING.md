# Testing Guide - Spanish Conjugator

Este proyecto implementa un sistema de testing automatizado completo con múltiples capas de verificación para garantizar la calidad del código y prevenir regresiones.

## 🏗️ Arquitectura de Testing

### Capas de Testing

```
┌─────────────────────────┐
│     E2E Tests           │  ← Playwright (user flows)
├─────────────────────────┤
│  Integration Tests      │  ← Vitest (modules working together)
├─────────────────────────┤
│    Unit Tests           │  ← Vitest (individual functions)
├─────────────────────────┤
│  Data Validation        │  ← Custom scripts (linguistic data)
└─────────────────────────┘
```

### Tipos de Tests

| Tipo | Framework | Propósito | Ubicación |
|------|-----------|-----------|-----------|
| **Unit** | Vitest | Funciones individuales | `src/**/*.test.js` |
| **Integration** | Vitest | Interacción entre módulos | `src/**/*.integration.test.js` |
| **E2E** | Playwright | Flujos de usuario completos | `tests/e2e/*.e2e.js` |
| **Visual** | Playwright | Regression visual | Tests con `@visual` |
| **Performance** | Vitest/Lighthouse | Rendimiento y métricas | `*.performance.test.js` |
| **Smoke** | Playwright | Funcionalidad crítica | `smoke.e2e.js` |

## 🚀 Comandos de Testing

### Comandos Principales

```bash
# Ejecutar todos los tests
npm run test:all

# Tests unitarios únicamente
npm test

# Tests con interfaz visual
npm run test:ui

# Tests con cobertura
npm run test:coverage

# Tests E2E
npm run test:e2e

# Tests E2E con interfaz
npm run test:e2e:ui

# Visual regression tests
npm run test:visual
```

### Comandos de Desarrollo

```bash
# Watch mode para desarrollo
npm run test:watch

# Tests específicos
npm run test:unit
npm run test:integration
npm run test:smoke
npm run test:performance

# Debug E2E
npm run test:e2e:debug

# Quality gates completos
npm run quality:check
```

## 📊 Coverage y Métricas

### Targets de Cobertura

| Módulo | Branches | Functions | Lines | Statements |
|--------|----------|-----------|-------|------------|
| **Global** | 70% | 75% | 80% | 80% |
| **Core Logic** | 85% | 90% | 90% | 90% |
| **Progress System** | 80% | 85% | 85% | 85% |

### Generación de Reportes

```bash
# Reporte HTML interactivo
npm run test:coverage
open coverage/index.html

# UI con cobertura en vivo
npm run test:coverage:ui
```

## 🧪 Escribiendo Tests

### Unit Tests - Ejemplo

```javascript
import { describe, it, expect } from 'vitest'
import { mockVerb, expectValidGeneratorOutput } from '../test-utils/index.js'
import { chooseNext } from './generator.js'

describe('Generator', () => {
  it('should generate valid verb forms', () => {
    const result = chooseNext()
    expectValidGeneratorOutput(result)
  })
})
```

### Integration Tests - Ejemplo

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithProviders, mockSettings } from '../../test-utils/index.js'
import DrillComponent from './Drill.jsx'

describe('Drill Integration', () => {
  beforeEach(() => {
    // Setup integration test environment
  })

  it('should complete full practice flow', async () => {
    const { user } = renderWithProviders(<DrillComponent />)
    // Test complete user interaction
  })
})
```

### E2E Tests - Ejemplo

```javascript
import { test, expect } from '@playwright/test'

test('complete practice session', async ({ page }) => {
  await page.goto('/?mode=practice')

  // Test user flow
  await expect(page.locator('main')).toBeVisible()

  // Visual regression
  await expect(page).toHaveScreenshot('practice-session.png')
})
```

## 🎯 Best Practices

### Unit Tests

- ✅ Test una función específica
- ✅ Usa mocks para dependencias externas
- ✅ Nombres descriptivos de tests
- ✅ Arrange-Act-Assert pattern
- ❌ No testees implementación, testea comportamiento

### Integration Tests

- ✅ Test interacciones entre módulos reales
- ✅ Usa datos representativos
- ✅ Test casos de error
- ✅ Verifica side effects
- ❌ No dupliques tests unitarios

### E2E Tests

- ✅ Test flujos de usuario críticos
- ✅ Usa data-testid para selectors estables
- ✅ Test en múltiples browsers/viewports
- ✅ Include visual regression tests
- ❌ No testees implementación UI específica

## 🔧 Configuración

### Vitest Config

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.js'],
    coverage: {
      thresholds: {
        global: { branches: 70, functions: 75, lines: 80, statements: 80 }
      }
    }
  }
})
```

### Playwright Config

```javascript
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }
  ]
})
```

## 📈 CI/CD Integration

### Pipeline de Testing

```yaml
# .github/workflows/ci.yml
jobs:
  test-matrix:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: ['20', '22', '24']
    steps:
      - run: npm test -- --coverage
      - run: npm run test:e2e
```

### Quality Gates

- ✅ Todos los tests unitarios pasan
- ✅ Coverage targets alcanzados
- ✅ Tests E2E smoke pasan
- ✅ Performance dentro de budgets
- ✅ Visual regression sin cambios no aprobados

## 🛠️ Test Utilities

### Helpers Disponibles

```javascript
import {
  mockVerb,
  mockDrillItem,
  mockProgressData,
  mockSettings,
  renderWithProviders,
  expectValidGeneratorOutput,
  expectValidProgressData,
  measurePerformance,
  createTestDatabase
} from '../test-utils/index.js'
```

### Custom Matchers

```javascript
// Matchers específicos del dominio
expect(verbForm).toHaveValidVerbForm()
expect(masteryScore).toHaveValidMasteryScore()
```

## 🐛 Debugging Tests

### Vitest Debug

```bash
# Debug en VSCode
npm run test:watch
# Usar debugger; en el código

# UI para explorar tests
npm run test:ui
```

### Playwright Debug

```bash
# Modo debug interactivo
npm run test:e2e:debug

# Con headed browser
npx playwright test --headed

# Step-by-step debugging
npx playwright test --debug
```

## 📱 Testing Mobile y PWA

### Responsive Testing

```javascript
// Test múltiples viewports
const viewports = [
  { width: 375, height: 667 }, // iPhone SE
  { width: 414, height: 896 }, // iPhone 11
  { width: 1920, height: 1080 } // Desktop
]
```

### PWA Testing

```javascript
// Test offline functionality
await context.setOffline(true)
await page.reload()
await expect(page.locator('main')).toBeVisible()
```

## 📊 Performance Testing

### Lighthouse Integration

```bash
# Performance audit
npm run test:lighthouse

# Con thresholds
lighthouse --chrome-flags="--headless" --output=json --quiet
```

### Performance Budgets

- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s
- Time to Interactive: < 4s
- Cumulative Layout Shift: < 0.1

## 🔍 Visual Regression

### Screenshot Testing

```javascript
// Comparación automática de screenshots
await expect(page).toHaveScreenshot('feature.png')

// Con threshold personalizado
await expect(page).toHaveScreenshot('feature.png', { threshold: 0.3 })
```

### Manejo de Screenshots

```bash
# Actualizar screenshots base
npx playwright test --update-snapshots

# Solo tests visuales
npm run test:visual
```

## 🚨 Troubleshooting

### Tests Flaky

```javascript
// Usar retry en CI
test.describe.configure({ retries: 2 })

// Timeouts apropiados
await expect(element).toBeVisible({ timeout: 10000 })

// Wait for stable states
await page.waitForLoadState('networkidle')
```

### Performance Issues

```javascript
// Parallel execution
workers: process.env.CI ? 1 : undefined

// Test isolation
isolate: true
```

## 📚 Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)