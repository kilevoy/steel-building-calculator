export type TrussGeometrySpan = 18 | 24 | 30

export interface TrussGeometryNode {
  id: string
  xMm: number
  belt: 'top' | 'bottom'
}

export interface TrussGeometryMember {
  id: string
  from: string
  to: string
  kind: 'top-chord' | 'bottom-chord' | 'web'
}

export interface TrussGeometryLabel {
  id: string
  text: string
  kind: 'top-panel' | 'bottom-panel' | 'web-panel'
  memberIds: string[]
}

export interface TrussGeometryTemplate {
  spanM: TrussGeometrySpan
  supportHeightMm: number
  topPanelWidthMm: number
  edgeBottomPanelWidthMm: number
  nodes: TrussGeometryNode[]
  members: TrussGeometryMember[]
  labels: TrussGeometryLabel[]
}

function buildTemplate(spanM: TrussGeometrySpan, supportHeightMm: number): TrussGeometryTemplate {
  const panelCount = spanM / 3
  const topPanelWidthMm = 3000
  const edgeBottomPanelWidthMm = 1500

  const topNodes = Array.from({ length: panelCount + 1 }, (_, index) => ({
    id: `T${index}`,
    xMm: index * topPanelWidthMm,
    belt: 'top' as const,
  }))

  const bottomNodes = Array.from({ length: panelCount }, (_, index) => ({
    id: `B${index}`,
    xMm: edgeBottomPanelWidthMm + index * topPanelWidthMm,
    belt: 'bottom' as const,
  }))

  const topChordMembers = Array.from({ length: panelCount }, (_, index) => ({
    id: `TC${index + 1}`,
    from: `T${index}`,
    to: `T${index + 1}`,
    kind: 'top-chord' as const,
  }))

  const bottomChordMembers = Array.from({ length: Math.max(panelCount - 1, 0) }, (_, index) => ({
    id: `BC${index + 1}`,
    from: `B${index}`,
    to: `B${index + 1}`,
    kind: 'bottom-chord' as const,
  }))

  const webMembers = Array.from({ length: panelCount }, (_, index) => [
    {
      id: `WL${index + 1}`,
      from: `T${index}`,
      to: `B${index}`,
      kind: 'web' as const,
    },
    {
      id: `WR${index + 1}`,
      from: `B${index}`,
      to: `T${index + 1}`,
      kind: 'web' as const,
    },
  ]).flat()

  const halfPanelCount = panelCount / 2
  const topPanelLabels = Array.from({ length: halfPanelCount }, (_, index) => ({
    id: `LBL-TOP-${index + 1}`,
    text: `B${index + 1}`,
    kind: 'top-panel' as const,
    memberIds: [`TC${index + 1}`],
  }))

  const bottomPanelLabels = Array.from({ length: halfPanelCount }, (_, index) => ({
    id: `LBL-BOTTOM-${index + 1}`,
    text: `H${index + 1}`,
    kind: 'bottom-panel' as const,
    memberIds: [`BC${index + 1}`],
  }))

  const webLabels = Array.from({ length: halfPanelCount }, (_, index) => [
    {
      id: `LBL-WEB-${index * 2 + 1}`,
      text: `P${index * 2 + 1}`,
      kind: 'web-panel' as const,
      memberIds: [`WL${index + 1}`],
    },
    {
      id: `LBL-WEB-${index * 2 + 2}`,
      text: `P${index * 2 + 2}`,
      kind: 'web-panel' as const,
      memberIds: [`WR${index + 1}`],
    },
  ]).flat()

  return {
    spanM,
    supportHeightMm,
    topPanelWidthMm,
    edgeBottomPanelWidthMm,
    nodes: [...topNodes, ...bottomNodes],
    members: [...topChordMembers, ...bottomChordMembers, ...webMembers],
    labels: [...topPanelLabels, ...bottomPanelLabels, ...webLabels],
  }
}

const TRUSS_GEOMETRY_TEMPLATES: Record<TrussGeometrySpan, TrussGeometryTemplate> = {
  18: buildTemplate(18, 1060),
  24: buildTemplate(24, 1040),
  // TODO: verify the 30 m support height against the source workbook/series drawing.
  30: buildTemplate(30, 1020),
}

export function resolveTrussGeometryTemplate(spanM: number): TrussGeometryTemplate | null {
  if (Math.abs(spanM - 18) < 0.01) {
    return TRUSS_GEOMETRY_TEMPLATES[18]
  }

  if (Math.abs(spanM - 24) < 0.01) {
    return TRUSS_GEOMETRY_TEMPLATES[24]
  }

  if (Math.abs(spanM - 30) < 0.01) {
    return TRUSS_GEOMETRY_TEMPLATES[30]
  }

  return null
}
