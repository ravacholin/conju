import { expect, test } from 'vitest'
import { grade } from './grader.js'

test('lenient accepts vos when both enabled', ()=>{
  const expected = { value:'vení', alt:[], accepts:{tu:'ven'}, mood:'imperative',tense:'impAff',person:'2s_vos' }
  const res = grade('ven', expected, {useTuteo:true,useVoseo:true,useVosotros:false,strict:false,accentTolerance:'accept'})
  expect(res.correct).toBe(true)
})

test('strict mode only accepts target form', ()=>{
  const expected = { value:'vení', alt:[], accepts:{tu:'ven'}, mood:'imperative',tense:'impAff',person:'2s_vos' }
  const res = grade('ven', expected, {useTuteo:true,useVoseo:true,useVosotros:false,strict:true,accentTolerance:'accept'})
  expect(res.correct).toBe(false)
})

test('normalizes input for comparison', ()=>{
  const expected = { value:'hablás', alt:[], accepts:{}, mood:'indicative',tense:'pres',person:'2s_vos' }
  const res = grade('HABLAS', expected, {useTuteo:true,useVoseo:true,useVosotros:false,strict:false,accentTolerance:'accept'})
  expect(res.correct).toBe(true)
}) 