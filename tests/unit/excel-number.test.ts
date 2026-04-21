import {
  excelClampMin,
  excelRound,
  excelRoundDown,
  excelRoundUp,
} from '@/shared/excel/excel-number'

describe('excel-number helpers', () => {
  it('rounds like a standard Excel-compatible numeric helper for positive values', () => {
    expect(excelRound(12.3456, 2)).toBe(12.35)
  })

  it('rounds down toward zero', () => {
    expect(excelRoundDown(12.349, 2)).toBe(12.34)
    expect(excelRoundDown(-12.349, 2)).toBe(-12.34)
  })

  it('rounds up away from zero', () => {
    expect(excelRoundUp(12.341, 2)).toBe(12.35)
    expect(excelRoundUp(-12.341, 2)).toBe(-12.35)
  })

  it('clamps values to a minimum', () => {
    expect(excelClampMin(4, 5)).toBe(5)
    expect(excelClampMin(8, 5)).toBe(8)
  })
})
