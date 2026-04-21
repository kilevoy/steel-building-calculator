import { resolveTrussGeometryTemplate } from '@/domain/truss/model/truss-geometry'
import type { TrussCalculationResult } from '@/domain/truss/model/calculate-truss'
import type { UnifiedInputState } from '../model/unified-input'

interface TrussVisualDiagramProps {
  roofType: UnifiedInputState['roofType']
  trussResult: TrussCalculationResult
}

interface SvgPoint {
  x: number
  y: number
}

type WebMemberGroup = 'orb' | 'or' | 'rr'

const WEB_GROUP_COLORS: Record<WebMemberGroup, string> = {
  orb: '#c2410c',
  or: '#1d4ed8',
  rr: '#15803d',
}

function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
}

function formatMillimeters(valueMm: number): string {
  return Math.round(valueMm).toLocaleString('ru-RU')
}

function resolveRoofRiseM(spanM: number, roofSlopeDeg: number, roofType: UnifiedInputState['roofType']): number {
  const radians = (roofSlopeDeg * Math.PI) / 180
  const horizontalProjectionM = roofType === 'двускатная' ? spanM / 2 : spanM
  return Math.tan(radians) * horizontalProjectionM
}

function resolveWebMemberGroup(memberId: string, spanM: number): WebMemberGroup {
  const match = memberId.match(/^(WL|WR)(\d+)$/)
  if (!match) {
    return 'rr'
  }

  const panelIndex = Number(match[2])
  const panelCount = Math.round(spanM / 3)
  const mirroredIndex = Math.min(panelIndex, panelCount - panelIndex + 1)

  if (mirroredIndex === 1) {
    return 'orb'
  }

  if (mirroredIndex === 2) {
    return 'or'
  }

  return 'rr'
}

export function TrussVisualDiagram({ roofType, trussResult }: TrussVisualDiagramProps) {
  const template = resolveTrussGeometryTemplate(trussResult.loadSummary.spanM)

  if (!template) {
    return (
      <div className="truss-visual">
        <div className="truss-visual__unsupported">
          Типовая схема Молодечно пока задана только для пролетов `18 / 24 / 30 м`.
        </div>
      </div>
    )
  }

  const roofRiseM = resolveRoofRiseM(template.spanM, trussResult.loadSummary.roofSlopeDeg, roofType)
  const viewWidth = 1120
  const viewHeight = 420
  const baseY = 276
  const leftX = 108
  const rightX = 1010
  const drawingWidthPx = rightX - leftX
  const pxPerMm = drawingWidthPx / (template.spanM * 1000)
  const roofRisePx = roofRiseM * 1000 * pxPerMm
  const supportTopY = baseY - template.supportHeightMm * pxPerMm

  const topNodes = template.nodes
    .filter((node) => node.belt === 'top')
    .map((node) => {
      const ratio = node.xMm / (template.spanM * 1000)
      const y =
        roofType === 'односкатная'
          ? supportTopY - roofRisePx * ratio
          : supportTopY - roofRisePx * (1 - Math.abs(1 - 2 * ratio))

      return {
        id: node.id,
        x: leftX + node.xMm * pxPerMm,
        y,
      }
    })

  const bottomNodes = template.nodes
    .filter((node) => node.belt === 'bottom')
    .map((node) => ({
      id: node.id,
      x: leftX + node.xMm * pxPerMm,
      y: baseY,
    }))

  const nodeMap = new Map<string, SvgPoint>()
  for (const node of [...topNodes, ...bottomNodes]) {
    nodeMap.set(node.id, { x: node.x, y: node.y })
  }

  const topChordMembers = template.members.filter((member) => member.kind === 'top-chord')
  const bottomChordMembers = template.members.filter((member) => member.kind === 'bottom-chord')
  const webMembers = template.members.filter((member) => member.kind === 'web')

  const topChordPath = topChordMembers
    .map((member, index) => {
      const start = nodeMap.get(member.from)
      const end = nodeMap.get(member.to)
      if (!start || !end) {
        return ''
      }

      return `${index === 0 ? 'M' : 'L'} ${start.x} ${start.y} L ${end.x} ${end.y}`
    })
    .join(' ')

  const bottomChordPath = bottomChordMembers
    .map((member, index) => {
      const start = nodeMap.get(member.from)
      const end = nodeMap.get(member.to)
      if (!start || !end) {
        return ''
      }

      return `${index === 0 ? 'M' : 'L'} ${start.x} ${start.y} L ${end.x} ${end.y}`
    })
    .join(' ')

  const dimensionPoints = [
    { x: topNodes[0]?.x ?? leftX, y: baseY },
    ...bottomNodes.map((node) => ({ x: node.x, y: baseY })),
    { x: topNodes[topNodes.length - 1]?.x ?? rightX, y: baseY },
  ]

  const segmentWidthsMm = dimensionPoints.slice(0, -1).map((point, index) => {
    const nextPoint = dimensionPoints[index + 1]
    return ((nextPoint.x - point.x) / pxPerMm)
  })

  const labelPoints = template.labels.map((label) => {
    const referencedMembers = label.memberIds
      .map((memberId) => template.members.find((member) => member.id === memberId))
      .filter((member): member is NonNullable<typeof member> => Boolean(member))

    const points = referencedMembers.flatMap((member) => {
      const start = nodeMap.get(member.from)
      const end = nodeMap.get(member.to)
      if (!start || !end) {
        return []
      }
      return [
        { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      ]
    })

    const avgX = points.reduce((sum, point) => sum + point.x, 0) / Math.max(points.length, 1)
    const avgY = points.reduce((sum, point) => sum + point.y, 0) / Math.max(points.length, 1)
    const offsetY = label.kind === 'top-panel' ? -12 : label.kind === 'bottom-panel' ? -10 : -8

    return {
      ...label,
      x: avgX,
      y: avgY + offsetY,
    }
  })

  const vpAnchor = topChordMembers[Math.floor(topChordMembers.length / 2)]
  const npAnchor = bottomChordMembers[Math.floor(bottomChordMembers.length / 2)]
  const orbAnchor = webMembers.find((member) => resolveWebMemberGroup(member.id, template.spanM) === 'orb')
  const orAnchor = webMembers.find((member) => resolveWebMemberGroup(member.id, template.spanM) === 'or')
  const rrAnchor = webMembers.find((member) => resolveWebMemberGroup(member.id, template.spanM) === 'rr')

  const resolveMemberMidpoint = (memberId: string | undefined): SvgPoint | null => {
    if (!memberId) {
      return null
    }

    const member = template.members.find((item) => item.id === memberId)
    if (!member) {
      return null
    }

    const start = nodeMap.get(member.from)
    const end = nodeMap.get(member.to)
    if (!start || !end) {
      return null
    }

    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }
  }

  const vpPoint = resolveMemberMidpoint(vpAnchor?.id)
  const npPoint = resolveMemberMidpoint(npAnchor?.id)
  const orbPoint = resolveMemberMidpoint(orbAnchor?.id)
  const orPoint = resolveMemberMidpoint(orAnchor?.id)
  const rrPoint = resolveMemberMidpoint(rrAnchor?.id)
  const ridgeNode = topNodes.reduce(
    (best, node) => (node.y < best.y ? node : best),
    topNodes[0] ?? { id: 'fallback', x: (leftX + rightX) / 2, y: supportTopY },
  )
  const trussHeightDimensionX = rightX + 44
  const trussHeightMm = (baseY - ridgeNode.y) / pxPerMm

  return (
    <div className="truss-visual">
      <div className="truss-visual__canvas">
          <svg aria-label="Схема фермы" className="truss-visual__svg" viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
            <defs>
              <marker
                id="truss-dimension-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="4"
                refY="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#6f7b86" />
              </marker>
            </defs>

            <rect className="truss-visual__bg" x="0" y="0" width={viewWidth} height={viewHeight} rx="10" />

            <path className="truss-visual__member truss-visual__member--chord" d={topChordPath} />
            <path className="truss-visual__member truss-visual__member--chord" d={bottomChordPath} />

            {webMembers.map((member) => {
              const start = nodeMap.get(member.from)
              const end = nodeMap.get(member.to)
              if (!start || !end) {
                return null
              }

              const group = resolveWebMemberGroup(member.id, template.spanM)

              return (
                <line
                  className="truss-visual__member truss-visual__member--web"
                  key={member.id}
                  style={{ stroke: WEB_GROUP_COLORS[group] }}
                  x1={start.x}
                  x2={end.x}
                  y1={start.y}
                  y2={end.y}
                />
              )
            })}

            {bottomNodes.map((node) => (
              <circle className="truss-visual__node" cx={node.x} cy={node.y} key={node.id} r="3.8" />
            ))}
            {topNodes.map((node) => (
              <circle className="truss-visual__node" cx={node.x} cy={node.y} key={node.id} r="3.8" />
            ))}

            <line className="truss-visual__tick" x1={leftX} x2={leftX - 44} y1={baseY} y2={baseY} />
            <line
              className="truss-visual__tick"
              x1={leftX}
              x2={leftX - 44}
              y1={supportTopY}
              y2={supportTopY}
            />
            <line
              className="truss-visual__dimension"
              x1={leftX - 44}
              x2={leftX - 44}
              y1={baseY}
              y2={supportTopY}
              markerStart="url(#truss-dimension-arrow)"
              markerEnd="url(#truss-dimension-arrow)"
            />
            <text className="truss-visual__dimension-text" x={leftX - 66} y={(baseY + supportTopY) / 2}>
              {formatMillimeters(template.supportHeightMm)}
            </text>
            <line className="truss-visual__tick" x1={ridgeNode.x} x2={trussHeightDimensionX} y1={baseY} y2={baseY} />
            <line
              className="truss-visual__tick"
              x1={ridgeNode.x}
              x2={trussHeightDimensionX}
              y1={ridgeNode.y}
              y2={ridgeNode.y}
            />
            <line
              className="truss-visual__dimension"
              x1={trussHeightDimensionX}
              x2={trussHeightDimensionX}
              y1={baseY}
              y2={ridgeNode.y}
              markerStart="url(#truss-dimension-arrow)"
              markerEnd="url(#truss-dimension-arrow)"
            />
            <text
              className="truss-visual__dimension-text truss-visual__dimension-text--side"
              x={trussHeightDimensionX + 10}
              y={(baseY + ridgeNode.y) / 2}
            >
              {formatMillimeters(trussHeightMm)}
            </text>

            <line
              className="truss-visual__dimension"
              x1={leftX}
              x2={rightX}
              y1={baseY + 64}
              y2={baseY + 64}
              markerStart="url(#truss-dimension-arrow)"
              markerEnd="url(#truss-dimension-arrow)"
            />
            <text className="truss-visual__dimension-text truss-visual__dimension-text--total" x={(leftX + rightX) / 2} y={baseY + 56}>
              {formatMillimeters(template.spanM * 1000)}
            </text>

            {segmentWidthsMm.map((segmentWidthMm, index) => {
              const x1 = dimensionPoints[index].x
              const x2 = dimensionPoints[index + 1].x

              return (
                <g key={`segment-${index}`}>
                  <line className="truss-visual__tick" x1={x1} x2={x1} y1={baseY + 12} y2={baseY + 72} />
                  {index === segmentWidthsMm.length - 1 && (
                    <line className="truss-visual__tick" x1={x2} x2={x2} y1={baseY + 12} y2={baseY + 72} />
                  )}
                  <line
                    className="truss-visual__dimension"
                    x1={x1}
                    x2={x2}
                    y1={baseY + 34}
                    y2={baseY + 34}
                    markerStart="url(#truss-dimension-arrow)"
                    markerEnd="url(#truss-dimension-arrow)"
                  />
                  <text className="truss-visual__dimension-text" x={(x1 + x2) / 2} y={baseY + 28}>
                    {formatMillimeters(segmentWidthMm)}
                  </text>
                </g>
              )
            })}

            {labelPoints.filter((label) => label.kind !== 'web-panel').map((label) => (
              <text className="truss-visual__detail-label" key={label.id} x={label.x} y={label.y}>
                {label.text}
              </text>
            ))}

            {vpPoint && (
              <text className="truss-visual__group-label" x={vpPoint.x} y={vpPoint.y - 18}>
                ВП
              </text>
            )}
            {npPoint && (
              <text className="truss-visual__group-label" x={npPoint.x + 34} y={npPoint.y - 12}>
                НП
              </text>
            )}
            {orbPoint && (
              <text className="truss-visual__group-label" style={{ fill: WEB_GROUP_COLORS.orb }} x={orbPoint.x - 10} y={orbPoint.y - 10}>
                ОРб
              </text>
            )}
            {orPoint && (
              <text className="truss-visual__group-label" style={{ fill: WEB_GROUP_COLORS.or }} x={orPoint.x - 8} y={orPoint.y - 12}>
                ОР
              </text>
            )}
            {rrPoint && (
              <text className="truss-visual__group-label" style={{ fill: WEB_GROUP_COLORS.rr }} x={rrPoint.x} y={rrPoint.y - 10}>
                РР
              </text>
            )}

            <text
              className="truss-visual__angle-text"
              x={topNodes[Math.max(1, Math.floor(topNodes.length / 2) - 1)]?.x ?? leftX + 80}
              y={Math.min(...topNodes.map((node) => node.y)) - 42}
            >
              уклон {formatNumber(trussResult.loadSummary.roofSlopeDeg, 1)}°
            </text>
          </svg>
      </div>
    </div>
  )
}
