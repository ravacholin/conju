/**
 * Tests para pronunciationUtils
 * Verifica la correcta detección de digramas españoles (rr, ll, ch, ñ)
 */

import { describe, it, expect } from 'vitest'
import { generatePronunciationGuide, generateIPA, generatePronunciationTip } from '../pronunciationUtils.js'

describe('pronunciationUtils', () => {
  describe('generatePronunciationGuide', () => {
    describe('Digraph Detection', () => {
      it('should detect "rr" digraph correctly', () => {
        expect(generatePronunciationGuide('perro')).toBe('PERRO')
        expect(generatePronunciationGuide('carro')).toBe('CARRO')
        expect(generatePronunciationGuide('corriendo')).toBe('CORRIENDO')
      })

      it('should detect "ll" digraph correctly', () => {
        expect(generatePronunciationGuide('calle')).toBe('CALYE')
        expect(generatePronunciationGuide('llevar')).toBe('LYEVAR')
        expect(generatePronunciationGuide('pollo')).toBe('POLYO')
      })

      it('should detect "ch" digraph correctly', () => {
        expect(generatePronunciationGuide('mucho')).toBe('MUCHO')
        expect(generatePronunciationGuide('chico')).toBe('CHICO')
        expect(generatePronunciationGuide('leche')).toBe('LECHE')
      })

      it('should handle "ñ" correctly', () => {
        expect(generatePronunciationGuide('niño')).toBe('NINYO')
        expect(generatePronunciationGuide('mañana')).toBe('MANYANA')
        expect(generatePronunciationGuide('señor')).toBe('SENYOR')
      })

      it('should handle silent "h" correctly', () => {
        expect(generatePronunciationGuide('hablo')).toBe('ABLO')
        expect(generatePronunciationGuide('hacer')).toBe('ACER')
        expect(generatePronunciationGuide('hoy')).toBe('OY')
      })

      it('should handle "j" correctly', () => {
        expect(generatePronunciationGuide('hijo')).toBe('IHO')
        expect(generatePronunciationGuide('trabajo')).toBe('TRABAHO')
        expect(generatePronunciationGuide('mejor')).toBe('MEHOR')
      })
    })

    describe('Complex Words with Multiple Digraphs', () => {
      it('should handle multiple digraphs in same word', () => {
        expect(generatePronunciationGuide('llorando')).toBe('LYORANDO')
        expect(generatePronunciationGuide('chorrear')).toBe('CHORREAR')
        // achichorrar: a-ch-i-ch-o-rr-a-r = A-CH-I-CH-O-RR-A-R
        expect(generatePronunciationGuide('achichorrar')).toBe('ACHICHORRAR')
      })

      it('should handle words with h and digraphs', () => {
        expect(generatePronunciationGuide('hacha')).toBe('ACHA')
        expect(generatePronunciationGuide('hallar')).toBe('ALYAR')
        expect(generatePronunciationGuide('horrendo')).toBe('ORRENDO')
      })

      it('should handle words with j and digraphs', () => {
        expect(generatePronunciationGuide('jarro')).toBe('HARRO')
        expect(generatePronunciationGuide('jinete')).toBe('HINETE')
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(generatePronunciationGuide('')).toBe('')
      })

      it('should handle single character', () => {
        expect(generatePronunciationGuide('a')).toBe('A')
        expect(generatePronunciationGuide('h')).toBe('')
        expect(generatePronunciationGuide('j')).toBe('H')
      })

      it('should handle two-character words', () => {
        expect(generatePronunciationGuide('rr')).toBe('RR')
        expect(generatePronunciationGuide('ll')).toBe('LY')
        expect(generatePronunciationGuide('ch')).toBe('CH')
      })

      it('should not confuse single r with rr', () => {
        expect(generatePronunciationGuide('para')).toBe('PARA')
        expect(generatePronunciationGuide('caro')).toBe('CARO')
        expect(generatePronunciationGuide('realizar')).toBe('REALIZAR')
      })

      it('should not confuse single l with ll', () => {
        expect(generatePronunciationGuide('malo')).toBe('MALO')
        expect(generatePronunciationGuide('sal')).toBe('SAL')
        expect(generatePronunciationGuide('cola')).toBe('COLA')
      })

      it('should handle uppercase input', () => {
        expect(generatePronunciationGuide('PERRO')).toBe('PERRO')
        expect(generatePronunciationGuide('CALLE')).toBe('CALYE')
      })

      it('should handle mixed case', () => {
        expect(generatePronunciationGuide('Perro')).toBe('PERRO')
        expect(generatePronunciationGuide('CaLLe')).toBe('CALYE')
      })
    })

    describe('Real Verb Conjugations', () => {
      it('should handle common verb forms with rr', () => {
        expect(generatePronunciationGuide('corrí')).toBe('CORRÍ')
        expect(generatePronunciationGuide('correr')).toBe('CORRER')
        expect(generatePronunciationGuide('aburrir')).toBe('ABURRIR')
      })

      it('should handle common verb forms with ll', () => {
        expect(generatePronunciationGuide('llegar')).toBe('LYEGAR')
        expect(generatePronunciationGuide('llevo')).toBe('LYEVO')
        // desarrollar: d-e-s-a-rr-o-ll-a-r = D-E-S-A-RR-O-LY-A-R
        expect(generatePronunciationGuide('desarrollar')).toBe('DESARROLYAR')
      })

      it('should handle common verb forms with ch', () => {
        expect(generatePronunciationGuide('escuchar')).toBe('ESCUCHAR')
        expect(generatePronunciationGuide('escucho')).toBe('ESCUCHO')
        expect(generatePronunciationGuide('aprovechar')).toBe('APROVECHAR')
      })

      it('should handle common verb forms with ñ', () => {
        expect(generatePronunciationGuide('soñar')).toBe('SONYAR')
        expect(generatePronunciationGuide('enseñar')).toBe('ENSENYAR')
        expect(generatePronunciationGuide('diseñar')).toBe('DISENYAR')
      })
    })
  })

  describe('generateIPA', () => {
    it('should remove silent h', () => {
      expect(generateIPA('hablo')).toContain('ablo')
    })

    it('should convert qu to k', () => {
      expect(generateIPA('que')).toContain('ke')
      expect(generateIPA('quiero')).toContain('kiero')
    })

    it('should handle c before e/i', () => {
      expect(generateIPA('cena')).toContain('θena')
      expect(generateIPA('cinco')).toContain('θinco')
    })

    it('should wrap result in slashes', () => {
      expect(generateIPA('hola')).toMatch(/^\/.*\/$/)
    })
  })

  describe('generatePronunciationTip', () => {
    it('should provide tip for silent h', () => {
      const tip = generatePronunciationTip('hablo')
      expect(tip).toContain('muda')
    })

    it('should provide tip for rr', () => {
      const tip = generatePronunciationTip('perro')
      expect(tip).toContain('Vibra')
      expect(tip).toContain('rr')
    })

    it('should provide tip for ñ', () => {
      const tip = generatePronunciationTip('niño')
      expect(tip).toContain('ny')
    })

    it('should provide tip for j', () => {
      const tip = generatePronunciationTip('hijo')
      expect(tip).toContain('garganta')
    })

    it('should provide tip for ll', () => {
      const tip = generatePronunciationTip('calle')
      expect(tip).toContain('Ll')
      expect(tip).toContain('y')
    })

    it('should provide default tip when no special sounds', () => {
      const tip = generatePronunciationTip('casa')
      expect(tip).toContain('sílaba')
    })

    it('should combine multiple tips', () => {
      const tip = generatePronunciationTip('hallar')
      expect(tip).toContain('muda')
      expect(tip).toContain('Ll')
    })
  })
})
