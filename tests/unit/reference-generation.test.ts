import { renderReferenceModule, serializeReferenceValue } from '../../scripts/generate_reference_module'

describe('reference generation helpers', () => {
  it('serializes snapshot values as pretty JSON', () => {
    expect(serializeReferenceValue([{ city: 'Уфа', load: 1.2 }])).toBe(
      JSON.stringify([{ city: 'Уфа', load: 1.2 }], null, 2),
    )
  })

  it('renders a deterministic TypeScript module from exports', () => {
    const output = renderReferenceModule(
      {
        sampleLoads: [{ city: 'Уфа', snowLoadKpa: 1.2 }],
        sampleAxis: [5, 10],
      },
      'column',
    )

    expect(output).toContain('export const sampleLoads = [')
    expect(output).toContain('export const sampleAxis = [')
    expect(output).toContain('checked-in column reference snapshot')
  })
})
