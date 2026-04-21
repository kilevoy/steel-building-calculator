import type { CandidateResult } from '@/domain/common/model/candidate-result'
import type { ColumnCalculationResult } from '@/domain/column/model/calculate-column'
import type { ColumnGroupSpecification } from '@/domain/column/model/column-output'
import { calculateEnclosing } from '@/domain/enclosing/model/calculate-enclosing'
import { mapUnifiedInputToEnclosingInput } from '@/domain/enclosing/model/enclosing-mapper'
import type { EnclosingClassKey } from '@/domain/enclosing/model/enclosing-reference.generated'
import type { PurlinCalculationResult } from '@/domain/purlin/model/calculate-purlin'
import type { TrussCalculationResult } from '@/domain/truss/model/calculate-truss'
import { deriveHeights } from '../model/height-derivations'
import type { UnifiedInputState } from '../model/unified-input'

interface SelectionSummaryPageProps {
  input: UnifiedInputState
  purlinResult: PurlinCalculationResult | null
  trussResult: TrussCalculationResult | null
  columnResult: ColumnCalculationResult | null
  selectedEnclosingClassKey: EnclosingClassKey
  purlinSpecificationSource: UnifiedInputState['purlinSpecificationSource']
  purlinSelectionMode: UnifiedInputState['purlinSelectionMode']
  selectedSortPurlinIndex: number
  selectedLstkPurlinIndex: number
}

const WIND_REGION_BY_KPA = new Map<number, string>([
  [0.23, 'I'],
  [0.3, 'II'],
  [0.38, 'III'],
  [0.48, 'IV'],
  [0.6, 'V'],
  [0.73, 'VI'],
  [0.85, 'VII'],
])

const SNOW_REGION_LIMITS: ReadonlyArray<{ maxKpa: number; label: string }> = [
  { maxKpa: 0.5, label: 'I' },
  { maxKpa: 1.0, label: 'II' },
  { maxKpa: 1.5, label: 'III' },
  { maxKpa: 2.0, label: 'IV' },
  { maxKpa: 2.5, label: 'V' },
  { maxKpa: 3.0, label: 'VI' },
  { maxKpa: 3.5, label: 'VII' },
  { maxKpa: 4.0, label: 'VIII' },
]

function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function formatRub(value: number): string {
  return Math.round(value).toLocaleString('ru-RU')
}

function resolveSpansSummaryLabel(spansCount: UnifiedInputState['spansCount']): string {
  return spansCount === 'один' ? 'пролет один' : 'пролетов несколько'
}

function resolveCraneSummaryLabel(input: UnifiedInputState): string {
  const hasSupportCrane = input.supportCraneMode === 'есть'
  const hasHangingCrane = input.hangingCraneMode === 'есть'

  if (!hasSupportCrane && !hasHangingCrane) {
    return 'кранов нет'
  }

  return 'краны есть'
}

function resolveCoveringSummaryLabel(label: string): string {
  return label.trim().toLowerCase()
}

function resolveWindRegionLabel(windLoadKpa: number | undefined): string {
  if (windLoadKpa === undefined) {
    return '-'
  }

  const exactMatch = [...WIND_REGION_BY_KPA.entries()].find(
    ([kpa]) => Math.abs(kpa - windLoadKpa) < 0.001,
  )

  return exactMatch?.[1] ?? 'по таблице города'
}

function resolveSnowRegionLabel(snowLoadKpa: number | undefined): string {
  if (snowLoadKpa === undefined) {
    return '-'
  }

  const band = SNOW_REGION_LIMITS.find((item) => snowLoadKpa <= item.maxKpa + 0.001)
  return band?.label ?? 'по таблице города'
}

function resolveCandidateCostRub(candidate: CandidateResult): number | null {
  if (candidate.estimatedCostRub !== undefined) {
    return candidate.estimatedCostRub
  }

  if (candidate.priceTonRub !== undefined) {
    return (candidate.totalMassKg / 1000) * candidate.priceTonRub
  }

  return null
}

function resolveCandidatePriceTonRub(candidate: CandidateResult): number | null {
  if (candidate.priceTonRub !== undefined && candidate.priceTonRub > 0) {
    return candidate.priceTonRub
  }

  const totalCostRub = resolveCandidateCostRub(candidate)
  if (totalCostRub === null || candidate.totalMassKg <= 0) {
    return null
  }

  return (totalCostRub / candidate.totalMassKg) * 1000
}

function estimatePurlinCount(candidate: CandidateResult, frameStepM: number): number {
  if (frameStepM <= 0 || candidate.unitMassKg <= 0 || candidate.totalMassKg <= 0) {
    return 0
  }

  const estimate = candidate.totalMassKg / (candidate.unitMassKg * frameStepM)
  return Math.max(1, Math.round(estimate))
}

function resolveSelectedPurlinCandidate(
  purlinResult: PurlinCalculationResult | null,
  source: UnifiedInputState['purlinSpecificationSource'],
  selectionMode: UnifiedInputState['purlinSelectionMode'],
  selectedSortPurlinIndex: number,
  selectedLstkPurlinIndex: number,
): CandidateResult | null {
  const sortCandidates = purlinResult?.sortSteelTop10 ?? []
  const autoSortCandidate = sortCandidates[0] ?? null
  const manualSortCandidate = sortCandidates[selectedSortPurlinIndex] ?? null

  const lstkCandidates = [...(purlinResult?.lstkMp350Top ?? []), ...(purlinResult?.lstkMp390Top ?? [])]
  const autoLstkCandidate =
    lstkCandidates
      .map((candidate) => ({
        candidate,
        costRub: resolveCandidateCostRub(candidate) ?? Number.POSITIVE_INFINITY,
      }))
      .sort((left, right) => left.costRub - right.costRub)[0]?.candidate ?? null
  const manualLstkCandidate = lstkCandidates[selectedLstkPurlinIndex] ?? null

  if (source === 'sort') {
    return selectionMode === 'manual' ? manualSortCandidate ?? autoSortCandidate : autoSortCandidate
  }

  return selectionMode === 'manual' ? manualLstkCandidate ?? autoLstkCandidate : autoLstkCandidate
}

function normalizeMultiplierSymbol(value: string): string {
  return value.replace(/[xх*]/gi, '×')
}

function formatProfileDimensionToken(token: string, forceSingleFractionDigit: boolean): string {
  const normalized = token.trim().replace(',', '.')
  const value = Number(normalized)

  if (!Number.isFinite(value)) {
    return token.trim()
  }

  if (forceSingleFractionDigit) {
    return value.toLocaleString('ru-RU', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  }

  return Number.isInteger(value)
    ? value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    : value.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })
}

function resolveFormattedProfileDimensions(profile: string): string {
  const cleaned = normalizeMultiplierSymbol(profile.replace(/^(пр\.|кв\.)\s*/i, '').trim())
  const parts = cleaned.split('×').map((part) => part.trim()).filter(Boolean)

  if (parts.length === 0) {
    return cleaned
  }

  return parts
    .map((part, index) => formatProfileDimensionToken(part, index === parts.length - 1))
    .join('×')
}

function resolveProfileType(candidate: CandidateResult): string {
  const family = (candidate.family ?? '').toLowerCase()
  const profile = candidate.profile.trim().toLowerCase()

  if (family.includes('mp350') || family.includes('mp390')) {
    return 'ЛСТК профиль'
  }

  if (profile.startsWith('кв.')) {
    return 'Труба профильная квадратная'
  }

  if (profile.startsWith('пр.') || /\d+\s*[xх×]\s*\d+\s*[xх×]\s*\d+/i.test(profile)) {
    return 'Труба профильная прямоугольная'
  }

  if (/^\d+\s*ш\d*/i.test(profile) || /^\d+\s*б\d*/i.test(profile)) {
    return 'Двутавр горячекатаный'
  }

  if (/^\d+\s*[а-я]*п$/i.test(profile)) {
    return 'Швеллер горячекатаный'
  }

  return candidate.family === 'Sort steel' ? 'Сортовой профиль' : candidate.profile
}

function resolveProfileSize(candidate: CandidateResult): string {
  const cleaned = resolveFormattedProfileDimensions(candidate.profile)
  return /\d/.test(cleaned) ? `${cleaned} мм` : candidate.profile
}

function resolveSteelLabel(steelGrade: string): string {
  const normalized = steelGrade.trim()
  const match = normalized.match(/^С\s*(\d+)/i)

  if (!match) {
    return normalized
  }

  if (/^С\s*255/i.test(normalized) || /^С\s*345/i.test(normalized)) {
    return `${normalized} (кат. Б)`
  }

  return `${normalized} (класс прочности КП${match[1]})`
}

function resolveStandardLabel(candidate: CandidateResult): string {
  const profileType = resolveProfileType(candidate)

  if (profileType.startsWith('Труба профильная')) {
    return 'ГОСТ 32931-2015'
  }

  if (profileType === 'Двутавр горячекатаный') {
    return 'ГОСТ Р 57837-2017'
  }

  if (profileType === 'Швеллер горячекатаный') {
    return 'ГОСТ 8240-97'
  }

  return '-'
}

function resolveDesignation(candidate: CandidateResult, standardLabel: string): string {
  const steelMatch = candidate.steelGrade.trim().match(/^С\s*(\d+)/i)
  const steelToken = steelMatch ? `КП${steelMatch[1]}` : candidate.steelGrade.trim()
  const sizeToken = resolveFormattedProfileDimensions(candidate.profile)
  const profileType = resolveProfileType(candidate)

  if (profileType === 'Труба профильная квадратная') {
    return `Труба ПК-${sizeToken}-${steelToken}${standardLabel === '-' ? '' : `-${standardLabel}`}`
  }

  if (profileType === 'Труба профильная прямоугольная') {
    return `Труба ПП-${sizeToken}-${steelToken}${standardLabel === '-' ? '' : `-${standardLabel}`}`
  }

  if (profileType === 'Двутавр горячекатаный') {
    return `Двутавр ${candidate.profile.trim()}-${candidate.steelGrade.trim()}${
      standardLabel === '-' ? '' : `-${standardLabel}`
    }`
  }

  if (profileType === 'Швеллер горячекатаный') {
    return `Швеллер ${candidate.profile.trim()}-${candidate.steelGrade.trim()}${
      standardLabel === '-' ? '' : `-${standardLabel}`
    }`
  }

  return [candidate.profile.trim(), steelToken, standardLabel === '-' ? null : standardLabel]
    .filter(Boolean)
    .join('-')
}

function resolveDisplayProfile(candidate: CandidateResult): string {
  const profileType = resolveProfileType(candidate)
  return profileType.startsWith('Труба профильная') ? resolveProfileSize(candidate) : candidate.profile
}

function resolveGroupPriceTonRub(group: ColumnGroupSpecification): number | null {
  const candidatePriceTonRub = group.selectedCandidate ? resolveCandidatePriceTonRub(group.selectedCandidate) : null
  if (candidatePriceTonRub !== null) {
    return candidatePriceTonRub
  }

  if (group.totalMassKg <= 0 || group.totalCostRub <= 0) {
    return null
  }

  return (group.totalCostRub / group.totalMassKg) * 1000
}

function resolveColumnGroupTitle(group: ColumnGroupSpecification): string {
  if (group.key === 'extreme') {
    return 'Крайняя колонна'
  }

  if (group.key === 'fachwerk') {
    return 'Фахверковая колонна'
  }

  return 'Средняя колонна'
}

function resolveColumnHeaderClass(group: ColumnGroupSpecification): string {
  if (group.key === 'extreme') {
    return 'selection-summary-card__header--edge'
  }

  if (group.key === 'fachwerk') {
    return 'selection-summary-card__header--fachwerk'
  }

  return 'selection-summary-card__header--middle'
}

function resolveColumnGroupTotalLengthM(group: ColumnGroupSpecification): number {
  return group.rows.reduce((sum, row) => sum + row.lengthM * row.branchesCount, 0)
}

function resolveTrussCount(
  columnResult: ColumnCalculationResult | null,
  buildingLengthM: number,
  frameStepM: number,
): number {
  const extremeGroup = columnResult?.specification.groups.find((group) => group.key === 'extreme')
  if (extremeGroup && extremeGroup.columnsCount > 0) {
    return Math.max(1, Math.round(extremeGroup.columnsCount / 2))
  }

  if (frameStepM <= 0 || buildingLengthM <= 0) {
    return 0
  }

  return Math.max(1, Math.floor(buildingLengthM / frameStepM))
}

function resolveColumnHeightDisplay(group: ColumnGroupSpecification): string {
  const lengths = group.geometryLengthsM.filter((length) => Number.isFinite(length) && length > 0)

  if (lengths.length === 0) {
    return `${formatNumber(group.criticalHeightM, 1)} м`
  }

  const minHeightM = Math.min(...lengths)
  const maxHeightM = Math.max(...lengths)

  if (Math.abs(maxHeightM - minHeightM) < 0.05) {
    return `${formatNumber(maxHeightM, 1)} м`
  }

  return `${formatNumber(maxHeightM, 1)} м (${formatNumber(minHeightM, 1)}-${formatNumber(maxHeightM, 1)} м)`
}

function resolveTrussTubeSize(profile: string): string {
  const cleaned = profile.replace(/^тр\.\s*/i, '').trim()
  const normalized = normalizeMultiplierSymbol(cleaned)
  const parts = normalized.split('×').map((part) => part.trim()).filter(Boolean)

  if (parts.length === 2) {
    const sideToken = formatProfileDimensionToken(parts[0], false)
    const thicknessToken = formatProfileDimensionToken(parts[1], true)
    return `${sideToken}×${sideToken}×${thicknessToken}`
  }

  if (parts.length >= 3) {
    const heightToken = formatProfileDimensionToken(parts[0], false)
    const widthToken = formatProfileDimensionToken(parts[1], false)
    const thicknessToken = formatProfileDimensionToken(parts[2], true)
    return `${heightToken}×${widthToken}×${thicknessToken}`
  }

  return profile
}

function resolveTrussTubeType(profile: string): 'ПК' | 'ПП' {
  const cleaned = profile.replace(/^тр\.\s*/i, '').trim()
  const normalized = normalizeMultiplierSymbol(cleaned)
  const parts = normalized.split('×').map((part) => part.trim()).filter(Boolean)

  if (parts.length === 2) {
    return 'ПК'
  }

  if (parts.length >= 3 && parts[0] === parts[1]) {
    return 'ПК'
  }

  return 'ПП'
}

function resolveTrussSteelToken(thicknessMm: number | null): string {
  if (thicknessMm !== null && thicknessMm > 10) {
    return 'КП325'
  }

  return 'КП345'
}

function resolveTrussTubeDesignation(profile: string, thicknessMm: number | null): string {
  const typeToken = resolveTrussTubeType(profile)
  const sizeToken = resolveTrussTubeSize(profile)
  const steelToken = resolveTrussSteelToken(thicknessMm)

  return `Труба ${typeToken}-${sizeToken}-${steelToken}-ГОСТ 32931-2015`
}

function resolveTrussGroupLongLabel(key: string): string {
  if (key === 'vp') {
    return 'Верхний пояс'
  }

  if (key === 'np') {
    return 'Нижний пояс'
  }

  if (key === 'orb') {
    return 'Опорный раскос большой'
  }

  if (key === 'or') {
    return 'Опорный раскос'
  }

  return 'Рядовой раскос'
}

function resolveTrussTubeDescription(profile: string): string {
  const typeLabel = resolveTrussTubeType(profile) === 'ПК' ? 'Труба квадратная' : 'Труба прямоугольная'
  return `${typeLabel} ${resolveTrussTubeSize(profile)}`
}

function isSandwichPanelCovering(covering: string): boolean {
  const normalized = covering.trim().toLowerCase()
  return (
    normalized.includes('с-п') ||
    normalized.includes('с п') ||
    normalized.includes('сэндвич') ||
    normalized.includes('sandwich')
  )
}

function resolveFrameCount(buildingLengthM: number, frameStepM: number): number {
  if (frameStepM <= 0 || buildingLengthM <= 0) {
    return 0
  }

  return Math.max(1, Math.floor(buildingLengthM / frameStepM) + 1)
}

export function SelectionSummaryPage({
  input,
  purlinResult,
  trussResult,
  columnResult,
  selectedEnclosingClassKey,
  purlinSpecificationSource,
  purlinSelectionMode,
  selectedSortPurlinIndex,
  selectedLstkPurlinIndex,
}: SelectionSummaryPageProps) {
  const selectedCandidate = resolveSelectedPurlinCandidate(
    purlinResult,
    purlinSpecificationSource,
    purlinSelectionMode,
    selectedSortPurlinIndex,
    selectedLstkPurlinIndex,
  )

  const frameStepM = purlinResult?.loadSummary.frameStepM ?? 0
  const totalPurlinCount = selectedCandidate ? estimatePurlinCount(selectedCandidate, frameStepM) : 0
  const totalLengthM = totalPurlinCount > 0 ? totalPurlinCount * frameStepM : 0
  const selectedCostRub = selectedCandidate ? resolveCandidateCostRub(selectedCandidate) : null
  const selectedPriceTonRub = selectedCandidate ? resolveCandidatePriceTonRub(selectedCandidate) : null
  const standardLabel = selectedCandidate ? resolveStandardLabel(selectedCandidate) : '-'
  const designationLabel = selectedCandidate ? resolveDesignation(selectedCandidate, standardLabel) : '-'
  const snowRegionLabel = resolveSnowRegionLabel(purlinResult?.loadSummary.snowRegionKpa)
  const windRegionLabel = resolveWindRegionLabel(purlinResult?.loadSummary.windRegionKpa)
  const columnGroups =
    columnResult?.specification.groups.filter(
      (group) => group.columnsCount > 0 && group.selectedCandidate !== null,
    ) ?? []
  const columnTotalLengthM = columnGroups.reduce(
    (sum, group) => sum + resolveColumnGroupTotalLengthM(group),
    0,
  )
  const columnTotalCount = columnGroups.reduce((sum, group) => sum + group.columnsCount, 0)
  const heights = deriveHeights(input)
  const roofPurlinStepM =
    selectedCandidate?.stepMm && selectedCandidate.stepMm > 0 ? selectedCandidate.stepMm / 1000 : 1.5
  const enclosingInput = mapUnifiedInputToEnclosingInput({
    ...input,
    buildingHeightM: heights.eaveSupportHeightM,
    roofPurlinStepM,
  })
  const enclosingResult = calculateEnclosing(enclosingInput)
  const enclosingClass = enclosingResult.classes[selectedEnclosingClassKey]
  const includeWalls = isSandwichPanelCovering(input.wallCoveringType)
  const includeRoof = isSandwichPanelCovering(input.roofCoveringType)
  const enclosingWallsRub = includeWalls ? enclosingClass.walls.totals.sectionRub : 0
  const enclosingRoofRub = includeRoof ? enclosingClass.roof.totals.sectionRub : 0
  const enclosingWallsMassKg = includeWalls ? enclosingClass.walls.totals.panelMassKg : 0
  const enclosingRoofMassKg = includeRoof ? enclosingClass.roof.totals.panelMassKg : 0
  const enclosingTotalRub = enclosingWallsRub + enclosingRoofRub
  const enclosingTotalMassKg = enclosingWallsMassKg + enclosingRoofMassKg
  const trussCount = trussResult
    ? resolveTrussCount(columnResult, input.buildingLengthM, trussResult.loadSummary.frameStepM)
    : 0
  const frameCount = resolveFrameCount(input.buildingLengthM, input.frameStepM)
  const trussUnitCostRub =
    trussResult?.totalMassKg == null ? null : trussResult.totalMassKg * input.tubeS345PriceRubPerKg
  const trussTotalMassKg = trussResult?.totalMassKg == null ? null : trussResult.totalMassKg * trussCount
  const trussTotalCostRub = trussTotalMassKg === null ? null : trussTotalMassKg * input.tubeS345PriceRubPerKg
  const trussPriceTonRub = input.tubeS345PriceRubPerKg > 0 ? input.tubeS345PriceRubPerKg * 1000 : null
  const trussGroupEntries = trussResult
    ? [trussResult.groups.vp, trussResult.groups.np, trussResult.groups.orb, trussResult.groups.or, trussResult.groups.rr]
    : []
  const trussDesignationEntries = trussGroupEntries
    .filter((group) => group.status === 'ok' && group.profile)
    .map((group) => resolveTrussTubeDesignation(group.profile as string, group.thicknessMm))
  const trussDesignationLabel = [...new Set(trussDesignationEntries)].join('\n')
  const projectTotalMassKg =
    (columnResult?.specification.totalMassKg ?? 0) +
    (selectedCandidate?.totalMassKg ?? 0) +
    (trussTotalMassKg ?? 0) +
    enclosingTotalMassKg
  const projectTotalCostRub =
    (columnResult?.specification.totalCostRub ?? 0) +
    (selectedCostRub ?? 0) +
    (trussTotalCostRub ?? 0) +
    enclosingTotalRub
  const projectBreakdownItems = [
    {
      label: 'Колонны',
      massKg: columnResult?.specification.totalMassKg ?? 0,
      costRub: columnResult?.specification.totalCostRub ?? 0,
    },
    {
      label: 'Фермы',
      massKg: trussTotalMassKg ?? 0,
      costRub: trussTotalCostRub ?? 0,
    },
    {
      label: 'Прогоны',
      massKg: selectedCandidate?.totalMassKg ?? 0,
      costRub: selectedCostRub ?? 0,
    },
    {
      label: 'Ограждающие',
      massKg: enclosingTotalMassKg,
      costRub: enclosingTotalRub,
    },
  ]
  const projectStatItems = [
    { label: 'Рам', value: `${formatNumber(frameCount, 0)} шт.` },
    { label: 'Ферм', value: `${formatNumber(trussCount, 0)} шт.` },
    { label: 'Колонн', value: `${formatNumber(columnTotalCount, 0)} шт.` },
    { label: 'Площадь кровли', value: `${formatNumber(enclosingResult.geometry.roofAreaM2, 1)} м²` },
    { label: 'Площадь стен', value: `${formatNumber(enclosingResult.geometry.wallAreaNetM2, 1)} м²` },
    { label: 'Масса ограждающих', value: `${formatNumber(enclosingTotalMassKg, 1)} кг` },
  ]
  const summaryPassportItems = [
    input.city || 'Город не выбран',
    `снеговой район ${snowRegionLabel}`,
    `ветровой район ${windRegionLabel}`,
    `${formatNumber(input.spanM, 0)}х${formatNumber(input.buildingLengthM, 0)}х${formatNumber(input.clearHeightToBottomChordM, 0)}`,
    resolveSpansSummaryLabel(input.spansCount),
    `шаг рам ${formatNumber(input.frameStepM, 1)} м`,
    `кровля ${input.roofType.toLowerCase()}`,
    `уклон ${formatNumber(input.roofSlopeDeg, 1)}°`,
    resolveCraneSummaryLabel(input),
    `кровля ${resolveCoveringSummaryLabel(input.roofCoveringType)}`,
    `стены ${resolveCoveringSummaryLabel(input.wallCoveringType)}`,
  ]

  return (
    <div className="tab-pane animate-in" data-testid="selection-summary-page">
      <div className="selection-summary-layout">
        <section className="selection-summary-sheet-head">
          <div className="selection-summary-sheet-head__content">
            <div>
              <h2 className="selection-summary-sheet-title">Итог подбора</h2>
              <p className="selection-summary-sheet-note">
                Сводная спецификация по основным конструкциям с ориентировочной массой и стоимостью проекта.
              </p>
            </div>

            <button className="results-print-action" onClick={() => window.print()}>
              Печать / PDF
            </button>
          </div>

          <div className="selection-summary-passport" aria-label="Краткое описание объекта">
            {summaryPassportItems.map((item) => (
              <span className="selection-summary-passport__item" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="selection-summary-overview">
          <div className="selection-summary-overview__hero">
            <div className="selection-summary-overview__eyebrow">Итоги по проекту</div>
            <div className="selection-summary-overview__total">
              {formatRub(projectTotalCostRub)} ₽
            </div>
            <div className="selection-summary-overview__lead">
              Ориентировочная стоимость металлокаркаса и ограждающих по текущему подбору.
            </div>

            <div className="selection-summary-overview__metrics">
              <div className="selection-summary-overview__metric">
                <span>Общая масса</span>
                <strong>{formatNumber(projectTotalMassKg, 1)} кг</strong>
              </div>
              <div className="selection-summary-overview__metric">
                <span>Стоимость колонн</span>
                <strong>{formatNumber(columnResult?.specification.totalCostRub ?? 0, 0)} ₽</strong>
              </div>
              <div className="selection-summary-overview__metric">
                <span>Стоимость ферм</span>
                <strong>{formatNumber(trussTotalCostRub ?? 0, 0)} ₽</strong>
              </div>
              <div className="selection-summary-overview__metric">
                <span>Стоимость ограждающих</span>
                <strong>{formatNumber(enclosingTotalRub, 0)} ₽</strong>
              </div>
            </div>
          </div>

          <div className="selection-summary-overview__aside">
            <div className="selection-summary-overview__section-title">Состав стоимости</div>
            <div className="selection-summary-overview__breakdown">
              {projectBreakdownItems.map((item) => (
                <div className="selection-summary-overview__breakdown-item" key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <strong>{formatRub(item.costRub)} ₽</strong>
                  </div>
                  <small>{formatNumber(item.massKg, 1)} кг</small>
                </div>
              ))}
            </div>
          </div>

          <div className="selection-summary-overview__stats">
            {projectStatItems.map((item) => (
              <div className="selection-summary-overview__stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        {columnGroups.length > 0 && (
          <section className="selection-summary-columns">
            <div className="selection-summary-page-title">Колонны</div>

            <div className="selection-summary-cards-grid">
              {columnGroups.map((group) => {
                const candidate = group.selectedCandidate
                if (!candidate) {
                  return null
                }

                const groupStandardLabel = resolveStandardLabel(candidate)
                const groupDesignationLabel = resolveDesignation(candidate, groupStandardLabel)
                const groupPriceTonRub = resolveGroupPriceTonRub(group)
                const groupTotalLengthM = resolveColumnGroupTotalLengthM(group)

                return (
                  <section className="selection-summary-card" key={group.key}>
                    <div className={`selection-summary-card__header ${resolveColumnHeaderClass(group)}`}>
                      {resolveColumnGroupTitle(group)}
                    </div>

                    <div className="selection-summary-card__body">
                      <div className="selection-summary-card__section">
                        <div className="selection-summary-card__section-title">Параметры профиля</div>

                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Тип</span>
                          <span className="selection-summary-card__value">{resolveProfileType(candidate)}</span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Размер</span>
                          <span className="selection-summary-card__value selection-summary-card__value--highlight">
                            {resolveDisplayProfile(candidate)}
                          </span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Сталь</span>
                          <span className="selection-summary-card__value">{resolveSteelLabel(candidate.steelGrade)}</span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Стандарт</span>
                          <span className="selection-summary-card__value">{groupStandardLabel}</span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Масса 1 м</span>
                          <span className="selection-summary-card__value">
                            {formatNumber(candidate.unitMassKg, 2)} кг
                          </span>
                        </div>
                      </div>

                      <div className="selection-summary-card__section">
                        <div className="selection-summary-card__section-title">Объем поставки</div>

                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Высота</span>
                          <span className="selection-summary-card__value">{resolveColumnHeightDisplay(group)}</span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Количество</span>
                          <span className="selection-summary-card__value">{formatNumber(group.columnsCount, 0)} шт.</span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Общая длина</span>
                          <span className="selection-summary-card__value">{formatNumber(groupTotalLengthM, 1)} м.п.</span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Общая масса</span>
                          <span className="selection-summary-card__value">{formatNumber(group.totalMassKg, 1)} кг</span>
                        </div>
                      </div>

                      <div className="selection-summary-card__section">
                        <div className="selection-summary-card__section-title">Стоимость</div>

                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Цена за тонну</span>
                          <span className="selection-summary-card__value">
                            {groupPriceTonRub === null ? '-' : `${formatRub(groupPriceTonRub)} ₽/т`}
                          </span>
                        </div>
                        <div className="selection-summary-card__row">
                          <span className="selection-summary-card__label">Общая стоимость</span>
                          <span className="selection-summary-card__value selection-summary-card__value--cost">
                            {group.totalCostRub > 0 ? `${formatRub(group.totalCostRub)} ₽` : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="selection-summary-card__section selection-summary-card__section--last">
                        <div className="selection-summary-card__section-title">Условное обозначение</div>
                        <div className="selection-summary-card__code">{groupDesignationLabel}</div>
                      </div>
                    </div>
                  </section>
                )
              })}
            </div>

            <div className="selection-summary-total">
              <div className="selection-summary-total__row">
                <span className="selection-summary-total__label">Всего колонн</span>
                <span className="selection-summary-total__value">{formatNumber(columnTotalCount, 0)} шт.</span>
              </div>
              <div className="selection-summary-total__row">
                <span className="selection-summary-total__label">Общая длина</span>
                <span className="selection-summary-total__value">{formatNumber(columnTotalLengthM, 1)} м.п.</span>
              </div>
              <div className="selection-summary-total__row">
                <span className="selection-summary-total__label">Общая масса</span>
                <span className="selection-summary-total__value">
                  {formatNumber(columnResult?.specification.totalMassKg ?? 0, 1)} кг
                </span>
              </div>
              <div className="selection-summary-total__row">
                <span className="selection-summary-total__label">Общая стоимость</span>
                <span className="selection-summary-total__value selection-summary-total__value--highlight">
                  {formatRub(columnResult?.specification.totalCostRub ?? 0)} ₽
                </span>
              </div>
            </div>
          </section>
        )}

        <section className="selection-summary-columns">
          <div className="selection-summary-page-title">Ограждающие</div>

          <div className="selection-summary-cards-grid">
            <section className="selection-summary-card">
              <div className="selection-summary-card__header selection-summary-card__header--edge">Стены</div>

              <div className="selection-summary-card__body">
                <div className="selection-summary-card__section">
                  <div className="selection-summary-card__section-title">Параметры панели</div>

                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Тип</span>
                    <span className="selection-summary-card__value">
                      {includeWalls ? 'Сэндвич-панель' : 'Не учитывается'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Марка</span>
                    <span className="selection-summary-card__value selection-summary-card__value--highlight">
                      {includeWalls && enclosingClass.walls.panelSpecification[0]
                        ? enclosingClass.walls.panelSpecification[0].mark
                        : '-'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Стандарт</span>
                    <span className="selection-summary-card__value">
                      {includeWalls && enclosingClass.walls.panelSpecification[0]
                        ? enclosingClass.walls.panelSpecification[0].standard
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="selection-summary-card__section">
                  <div className="selection-summary-card__section-title">Объем поставки</div>

                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Площадь нетто</span>
                    <span className="selection-summary-card__value">
                      {includeWalls ? `${formatNumber(enclosingResult.geometry.wallAreaNetM2, 1)} м²` : '-'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Количество панелей</span>
                    <span className="selection-summary-card__value">
                      {includeWalls
                        ? `${formatNumber(
                            enclosingClass.walls.panelSpecification.reduce((sum, row) => sum + row.panelsCount, 0),
                            0,
                          )} шт.`
                        : '-'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Общая масса</span>
                    <span className="selection-summary-card__value">
                      {includeWalls ? `${formatNumber(enclosingWallsMassKg, 1)} кг` : '-'}
                    </span>
                  </div>
                </div>

                <div className="selection-summary-card__section selection-summary-card__section--last">
                  <div className="selection-summary-card__section-title">Стоимость</div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Общая стоимость</span>
                    <span className="selection-summary-card__value selection-summary-card__value--cost">
                      {includeWalls ? `${formatRub(enclosingWallsRub)} ₽` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="selection-summary-card">
              <div className="selection-summary-card__header selection-summary-card__header--fachwerk">Кровля</div>

              <div className="selection-summary-card__body">
                <div className="selection-summary-card__section">
                  <div className="selection-summary-card__section-title">Параметры панели</div>

                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Тип</span>
                    <span className="selection-summary-card__value">
                      {includeRoof ? 'Сэндвич-панель' : 'Не учитывается'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Марка</span>
                    <span className="selection-summary-card__value selection-summary-card__value--highlight">
                      {includeRoof && enclosingClass.roof.panelSpecification[0]
                        ? enclosingClass.roof.panelSpecification[0].mark
                        : '-'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Стандарт</span>
                    <span className="selection-summary-card__value">
                      {includeRoof && enclosingClass.roof.panelSpecification[0]
                        ? enclosingClass.roof.panelSpecification[0].standard
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="selection-summary-card__section">
                  <div className="selection-summary-card__section-title">Объем поставки</div>

                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Площадь кровли</span>
                    <span className="selection-summary-card__value">
                      {includeRoof ? `${formatNumber(enclosingResult.geometry.roofAreaM2, 1)} м²` : '-'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Количество панелей</span>
                    <span className="selection-summary-card__value">
                      {includeRoof
                        ? `${formatNumber(
                            enclosingClass.roof.panelSpecification.reduce((sum, row) => sum + row.panelsCount, 0),
                            0,
                          )} шт.`
                        : '-'}
                    </span>
                  </div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Общая масса</span>
                    <span className="selection-summary-card__value">
                      {includeRoof ? `${formatNumber(enclosingRoofMassKg, 1)} кг` : '-'}
                    </span>
                  </div>
                </div>

                <div className="selection-summary-card__section selection-summary-card__section--last">
                  <div className="selection-summary-card__section-title">Стоимость</div>
                  <div className="selection-summary-card__row">
                    <span className="selection-summary-card__label">Общая стоимость</span>
                    <span className="selection-summary-card__value selection-summary-card__value--cost">
                      {includeRoof ? `${formatRub(enclosingRoofRub)} ₽` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="selection-summary-total">
            <div className="selection-summary-total__row">
              <span className="selection-summary-total__label">Масса ограждающих</span>
              <span className="selection-summary-total__value">{formatNumber(enclosingTotalMassKg, 1)} кг</span>
            </div>
            <div className="selection-summary-total__row">
              <span className="selection-summary-total__label">Стоимость ограждающих</span>
              <span className="selection-summary-total__value selection-summary-total__value--highlight">
                {formatRub(enclosingTotalRub)} ₽
              </span>
            </div>
          </div>
        </section>

        <div className="selection-summary-bottom-grid">
          <section className="selection-summary-columns">
            <div className="selection-summary-page-title">Фермы</div>

            <section className="selection-summary-card selection-summary-card--stretch">
              <div className="selection-summary-card__header">Подбор фермы</div>

              <div className="selection-summary-card__body">
                {!trussResult ? (
                  <div className="selection-summary-card__section selection-summary-card__section--last">
                    <div className="selection-summary-card__section-title">Статус</div>
                    <div className="selection-summary-card__row">
                      <span className="selection-summary-card__label">Результат</span>
                      <span className="selection-summary-card__value">Расчёт фермы пока недоступен</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="selection-summary-card__section">
                      <div className="selection-summary-card__section-title">Параметры фермы</div>

                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Пролёт</span>
                        <span className="selection-summary-card__value">
                          {formatNumber(trussResult.loadSummary.spanM, 1)} м
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Шаг рам</span>
                        <span className="selection-summary-card__value">
                          {formatNumber(trussResult.loadSummary.frameStepM, 1)} м
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Уклон кровли</span>
                        <span className="selection-summary-card__value">
                          {formatNumber(trussResult.loadSummary.roofSlopeDeg, 1)}°
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Удельная масса</span>
                        <span className="selection-summary-card__value">
                          {trussResult.specificMassKgPerM2 === null
                            ? '-'
                            : `${formatNumber(trussResult.specificMassKgPerM2, 2)} кг/м²`}
                        </span>
                      </div>
                    </div>

                    <div className="selection-summary-card__section">
                      <div className="selection-summary-card__section-title">Подобранные элементы</div>

                      {trussGroupEntries.map((group) => (
                        <div className="selection-summary-card__row" key={group.key}>
                          <span className="selection-summary-card__label">{resolveTrussGroupLongLabel(group.key)}</span>
                          <span className="selection-summary-card__value">
                            {group.status === 'ok' && group.profile ? resolveTrussTubeDescription(group.profile) : '—'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="selection-summary-card__section">
                      <div className="selection-summary-card__section-title">Объем поставки</div>

                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Количество ферм</span>
                        <span className="selection-summary-card__value">{formatNumber(trussCount, 0)} шт.</span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Масса одной фермы</span>
                        <span className="selection-summary-card__value">
                          {trussResult.totalMassKg === null ? '-' : `${formatNumber(trussResult.totalMassKg, 1)} кг`}
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Общая масса</span>
                        <span className="selection-summary-card__value">
                          {trussTotalMassKg === null ? '-' : `${formatNumber(trussTotalMassKg, 1)} кг`}
                        </span>
                      </div>
                    </div>

                    <div className="selection-summary-card__section">
                      <div className="selection-summary-card__section-title">Стоимость</div>

                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Цена за тонну</span>
                        <span className="selection-summary-card__value">
                          {trussPriceTonRub === null ? '-' : `${formatRub(trussPriceTonRub)} ₽/т`}
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Стоимость одной фермы</span>
                        <span className="selection-summary-card__value">
                          {trussUnitCostRub === null ? '-' : `${formatRub(trussUnitCostRub)} ₽`}
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Общая стоимость</span>
                        <span className="selection-summary-card__value selection-summary-card__value--cost">
                          {trussTotalCostRub === null ? '-' : `${formatRub(trussTotalCostRub)} ₽`}
                        </span>
                      </div>
                    </div>

                    <div className="selection-summary-card__section selection-summary-card__section--last">
                      <div className="selection-summary-card__section-title">Условное обозначение</div>
                      <div className="selection-summary-card__code">
                        {trussDesignationLabel || 'Профили фермы не подобраны'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </section>

          <section className="selection-summary-columns">
            <div className="selection-summary-page-title">Прогоны</div>

            <section className="selection-summary-card selection-summary-card--stretch">
              <div className="selection-summary-card__header">
                {selectedCandidate ? 'Прогон подобран' : 'Подбор прогона'}
              </div>

              <div className="selection-summary-card__body">
                {!selectedCandidate ? (
                  <div className="selection-summary-card__section selection-summary-card__section--last">
                    <div className="selection-summary-card__section-title">Статус</div>
                    <div className="selection-summary-card__row">
                      <span className="selection-summary-card__label">Результат</span>
                      <span className="selection-summary-card__value">Подходящий вариант пока не найден</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="selection-summary-card__section">
                      <div className="selection-summary-card__section-title">Параметры профиля</div>

                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Тип</span>
                        <span className="selection-summary-card__value">{resolveProfileType(selectedCandidate)}</span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Размер</span>
                        <span className="selection-summary-card__value selection-summary-card__value--highlight">
                          {resolveProfileSize(selectedCandidate)}
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Сталь</span>
                        <span className="selection-summary-card__value">{resolveSteelLabel(selectedCandidate.steelGrade)}</span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Стандарт</span>
                        <span className="selection-summary-card__value">{standardLabel}</span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Масса 1 м</span>
                        <span className="selection-summary-card__value">
                          {formatNumber(selectedCandidate.unitMassKg, 2)} кг
                        </span>
                      </div>
                    </div>

                    <div className="selection-summary-card__section">
                      <div className="selection-summary-card__section-title">Объем поставки</div>

                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Длина прогона</span>
                        <span className="selection-summary-card__value">{formatNumber(frameStepM, 1)} м</span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Количество</span>
                        <span className="selection-summary-card__value">{formatNumber(totalPurlinCount, 0)} шт.</span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Общая длина</span>
                        <span className="selection-summary-card__value">{formatNumber(totalLengthM, 1)} м.п.</span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Общая масса</span>
                        <span className="selection-summary-card__value">
                          {formatNumber(selectedCandidate.totalMassKg, 1)} кг
                        </span>
                      </div>
                    </div>

                    <div className="selection-summary-card__section">
                      <div className="selection-summary-card__section-title">Стоимость</div>

                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Цена за тонну</span>
                        <span className="selection-summary-card__value">
                          {selectedPriceTonRub === null ? '-' : `${formatRub(selectedPriceTonRub)} ₽/т`}
                        </span>
                      </div>
                      <div className="selection-summary-card__row">
                        <span className="selection-summary-card__label">Общая стоимость</span>
                        <span className="selection-summary-card__value selection-summary-card__value--cost">
                          {selectedCostRub === null ? '-' : `${formatRub(selectedCostRub)} ₽`}
                        </span>
                      </div>
                    </div>

                    <div className="selection-summary-card__section selection-summary-card__section--last">
                      <div className="selection-summary-card__section-title">Условное обозначение</div>
                      <div className="selection-summary-card__code">{designationLabel}</div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </section>
        </div>

      </div>
    </div>
  )
}
