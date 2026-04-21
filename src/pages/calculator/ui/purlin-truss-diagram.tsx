import { resolveTrussGeometryTemplate } from '@/domain/truss/model/truss-geometry'
import type { UnifiedInputState } from '../model/unified-input'

interface PurlinTrussDiagramProps {
  roofType: UnifiedInputState['roofType']
  roofSlopeDeg: number
  spanM: number
  selectedPurlinFamily: string | null
  selectedPurlinStepMm: number | null
  selectedPurlinProfile: string | null
}

interface SvgPoint {
  x: number
  y: number
}

interface PositionedPurlin {
  x: number
  y: number
  angleRad: number
  isNodeSupported: boolean
}

type PurlinShapeKind = 'tube' | 'z' | 'channel' | 'generic'

function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
}

function formatMillimeters(valueMm: number): string {
  return Math.round(valueMm).toLocaleString('ru-RU')
}

function resolveRoofRiseM(
  spanM: number,
  roofSlopeDeg: number,
  roofType: UnifiedInputState['roofType'],
): number {
  const radians = (roofSlopeDeg * Math.PI) / 180
  const horizontalProjectionM = roofType === 'двускатная' ? spanM / 2 : spanM
  return Math.tan(radians) * horizontalProjectionM
}

function resolvePointAlongPolyline(points: SvgPoint[], distancePx: number): Omit<PositionedPurlin, 'isNodeSupported'> | null {
  let traversedPx = 0

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    const segmentLengthPx = Math.hypot(end.x - start.x, end.y - start.y)

    if (segmentLengthPx <= 0) {
      continue
    }

    if (traversedPx + segmentLengthPx >= distancePx) {
      const ratio = (distancePx - traversedPx) / segmentLengthPx
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
        angleRad: Math.atan2(end.y - start.y, end.x - start.x),
      }
    }

    traversedPx += segmentLengthPx
  }

  return null
}

function resolvePolylineLength(points: SvgPoint[]): number {
  return points.slice(0, -1).reduce((sum, point, index) => {
    const nextPoint = points[index + 1]
    return sum + Math.hypot(nextPoint.x - point.x, nextPoint.y - point.y)
  }, 0)
}

function resolvePurlinMarkers(points: SvgPoint[], stepPx: number, nodePoints: SvgPoint[]): PositionedPurlin[] {
  if (points.length < 2 || stepPx <= 0) {
    return []
  }

  const slopeLengthPx = resolvePolylineLength(points)
  if (slopeLengthPx <= 0) {
    return []
  }

  const tolerancePx = Math.max(stepPx * 0.08, 10)
  const markers: PositionedPurlin[] = []

  for (let distancePx = 0; distancePx <= slopeLengthPx + 0.01; distancePx += stepPx) {
    const point = resolvePointAlongPolyline(points, Math.min(distancePx, slopeLengthPx))
    if (!point) {
      continue
    }

    const isNodeSupported = nodePoints.some(
      (nodePoint) => Math.hypot(nodePoint.x - point.x, nodePoint.y - point.y) <= tolerancePx,
    )

    markers.push({
      ...point,
      isNodeSupported,
    })
  }

  return markers
}

function dedupePurlinMarkers(markers: PositionedPurlin[]): PositionedPurlin[] {
  return markers.filter((marker, index) => {
    return (
      markers.findIndex(
        (candidate) =>
          Math.abs(candidate.x - marker.x) < 0.5 &&
          Math.abs(candidate.y - marker.y) < 0.5,
      ) === index
    )
  })
}

function resolvePurlinShapeKind(
  family: string | null | undefined,
  profile: string | null | undefined,
): PurlinShapeKind {
  const familyNormalized = (family ?? '').trim().toLowerCase()
  const profileNormalized = (profile ?? '').trim().toLowerCase()

  if (familyNormalized.includes('/ z') || profileNormalized.startsWith('z')) {
    return 'z'
  }

  if (profileNormalized.startsWith('кв.') || profileNormalized.startsWith('пр.')) {
    return 'tube'
  }

  if (/^\d+\s*[а-я]*п$/i.test((profile ?? '').trim())) {
    return 'channel'
  }

  return 'generic'
}

export function PurlinTrussDiagram({
  roofType,
  roofSlopeDeg,
  spanM,
  selectedPurlinFamily,
  selectedPurlinStepMm,
  selectedPurlinProfile,
}: PurlinTrussDiagramProps) {
  const template = resolveTrussGeometryTemplate(spanM)

  if (!template) {
    return (
      <div className="truss-visual purlin-truss-visual">
        <div className="truss-visual__unsupported">
          Типовая схема фермы с прогонами пока задана только для пролетов `18 / 24 / 30 м`.
        </div>
      </div>
    )
  }

  const roofRiseM = resolveRoofRiseM(template.spanM, roofSlopeDeg, roofType)
  const viewWidth = 1120
  const viewHeight = 420
  const baseY = 282
  const leftX = 108
  const rightX = 1010
  const drawingWidthPx = rightX - leftX
  const pxPerMm = drawingWidthPx / (template.spanM * 1000)
  const roofRisePx = roofRiseM * 1000 * pxPerMm
  const supportTopY = baseY - template.supportHeightMm * pxPerMm
  const purlinStepPx = selectedPurlinStepMm && selectedPurlinStepMm > 0 ? selectedPurlinStepMm * pxPerMm : 0

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

  const topNodePoints = topNodes.map((node) => ({ x: node.x, y: node.y }))
  const midpointIndex = Math.floor(topNodes.length / 2)
  const roofPolylines =
    roofType === 'двускатная'
      ? [topNodePoints.slice(0, midpointIndex + 1), topNodePoints.slice(midpointIndex)]
      : [topNodePoints]

  const purlinMarkers = dedupePurlinMarkers(
    roofPolylines.flatMap((polyline) => resolvePurlinMarkers(polyline, purlinStepPx, topNodePoints)),
  )
  const nodeSupportedCount = purlinMarkers.filter((marker) => marker.isNodeSupported).length
  const betweenNodeCount = purlinMarkers.length - nodeSupportedCount
  const purlinShapeKind = resolvePurlinShapeKind(selectedPurlinFamily, selectedPurlinProfile)
  const ridgeNode = topNodes.reduce(
    (best, node) => (node.y < best.y ? node : best),
    topNodes[0] ?? { id: 'fallback', x: (leftX + rightX) / 2, y: supportTopY },
  )
  const trussHeightDimensionX = rightX + 44
  const trussHeightMm = (baseY - ridgeNode.y) / pxPerMm

  return (
    <div className="truss-visual purlin-truss-visual">
      <div className="truss-visual__canvas purlin-truss-visual__canvas">
        <svg
          aria-label="Схема фермы с прогонами"
          className="truss-visual__svg"
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        >
          <defs>
            <marker
              id="purlin-dimension-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#a04f08" />
            </marker>
            <marker
              id="purlin-span-arrow"
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

            return (
              <line
                className="truss-visual__member truss-visual__member--web"
                key={member.id}
                x1={start.x}
                x2={end.x}
                y1={start.y}
                y2={end.y}
              />
            )
          })}

          {topNodes.map((node) => (
            <circle className="truss-visual__node" cx={node.x} cy={node.y} key={node.id} r="3.8" />
          ))}
          {bottomNodes.map((node) => (
            <circle className="truss-visual__node" cx={node.x} cy={node.y} key={node.id} r="3.8" />
          ))}

          {purlinMarkers.map((marker, index) => {
            const rawNormalX = -Math.sin(marker.angleRad)
            const rawNormalY = Math.cos(marker.angleRad)
            const outwardNormalX = rawNormalY < 0 ? rawNormalX : -rawNormalX
            const outwardNormalY = rawNormalY < 0 ? rawNormalY : -rawNormalY
            const offset = 9
            const className = `purlin-truss-visual__purlin ${
              marker.isNodeSupported
                ? 'purlin-truss-visual__purlin--node'
                : 'purlin-truss-visual__purlin--between'
            }`
            const transform = `translate(${marker.x + outwardNormalX * offset} ${
              marker.y + outwardNormalY * offset
            }) rotate(${(marker.angleRad * 180) / Math.PI})`

            const renderShape = () => {
              if (purlinShapeKind === 'tube') {
                return <circle className={className} cx={0} cy={0} r={6.2} />
              }

              if (purlinShapeKind === 'z') {
                return (
                  <path
                    className={className}
                    d="M -13 -4 L -1 -4 L 3 0 L 13 0 M -13 0 L -3 0 L 1 4 L 13 4"
                  />
                )
              }

              if (purlinShapeKind === 'channel') {
                return <path className={className} d="M -11 -5 L -11 5 L 9 5 M -11 -5 L 9 -5" />
              }

              return (
                <line
                  className={className}
                  x1={-14}
                  x2={14}
                  y1={0}
                  y2={0}
                />
              )
            }

            return (
              <g key={`purlin-${index}`} transform={transform}>
                {renderShape()}
              </g>
            )
          })}

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
            markerStart="url(#purlin-span-arrow)"
            markerEnd="url(#purlin-span-arrow)"
          />
          <text
            className="truss-visual__dimension-text"
            x={leftX - 66}
            y={(baseY + supportTopY) / 2}
          >
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
            markerStart="url(#purlin-span-arrow)"
            markerEnd="url(#purlin-span-arrow)"
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
            y1={baseY + 66}
            y2={baseY + 66}
            markerStart="url(#purlin-span-arrow)"
            markerEnd="url(#purlin-span-arrow)"
          />
          <text
            className="truss-visual__dimension-text truss-visual__dimension-text--total"
            x={(leftX + rightX) / 2}
            y={baseY + 58}
          >
            {formatMillimeters(template.spanM * 1000)}
          </text>

          <text
            className="purlin-truss-visual__roof-label"
            x={topNodes[Math.max(1, Math.floor(topNodes.length / 2) - 1)]?.x ?? leftX + 90}
            y={Math.min(...topNodes.map((node) => node.y)) - 24}
          >
            прогоны по скату
          </text>
        </svg>

        <div className="purlin-truss-visual__meta">
          {selectedPurlinProfile && (
            <span className="purlin-truss-visual__chip">Профиль: {selectedPurlinProfile}</span>
          )}
          {selectedPurlinStepMm && selectedPurlinStepMm > 0 && (
            <span className="purlin-truss-visual__chip">
              Шаг: {formatMillimeters(selectedPurlinStepMm)} мм
            </span>
          )}
          <span className="purlin-truss-visual__chip">Схема: по расчетному шагу</span>
          <span className="purlin-truss-visual__chip">
            Рядов на схеме: {formatNumber(purlinMarkers.length, 0)}
          </span>
          <span className="purlin-truss-visual__chip">
            В узлах: {formatNumber(nodeSupportedCount, 0)}
          </span>
          <span className="purlin-truss-visual__chip">
            Между узлами: {formatNumber(betweenNodeCount, 0)}
          </span>
          <span className="purlin-truss-visual__chip">
            Уклон: {formatNumber(roofSlopeDeg, 1)}°
          </span>
        </div>
      </div>
    </div>
  )
}
