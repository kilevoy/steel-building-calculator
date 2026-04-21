import { describe, expect, it } from 'vitest'
import { resolveTrussGeometryTemplate } from '@/domain/truss/model/truss-geometry'

describe('resolveTrussGeometryTemplate', () => {
  it.each([
    {
      spanM: 18,
      supportHeightMm: 1060,
      topNodes: 7,
      bottomNodes: 6,
      members: 23,
      labels: 12,
    },
    {
      spanM: 24,
      supportHeightMm: 1040,
      topNodes: 9,
      bottomNodes: 8,
      members: 31,
      labels: 16,
    },
    {
      spanM: 30,
      supportHeightMm: 1020,
      topNodes: 11,
      bottomNodes: 10,
      members: 39,
      labels: 20,
    },
  ])(
    'returns a stable Molodechno geometry template for $spanM m',
    ({ spanM, supportHeightMm, topNodes, bottomNodes, members, labels }) => {
      const template = resolveTrussGeometryTemplate(spanM)

      expect(template).not.toBeNull()
      expect(template?.spanM).toBe(spanM)
      expect(template?.supportHeightMm).toBe(supportHeightMm)
      expect(template?.topPanelWidthMm).toBe(3000)
      expect(template?.edgeBottomPanelWidthMm).toBe(1500)
      expect(template?.nodes.filter((node) => node.belt === 'top')).toHaveLength(topNodes)
      expect(template?.nodes.filter((node) => node.belt === 'bottom')).toHaveLength(bottomNodes)
      expect(template?.members).toHaveLength(members)
      expect(template?.labels).toHaveLength(labels)
    },
  )

  it('returns null for unsupported spans', () => {
    expect(resolveTrussGeometryTemplate(21)).toBeNull()
    expect(resolveTrussGeometryTemplate(27)).toBeNull()
  })
})
