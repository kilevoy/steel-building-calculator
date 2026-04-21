import { useEffect, useState, useTransition } from 'react'
import type { DomainTab } from '@/app/App'
import { calculateColumn, type ColumnCalculationResult } from '@/domain/column/model/calculate-column'
import { parseEnclosingPricingValuesFromPdfFile } from '@/domain/enclosing/model/enclosing-price-pdf-import'
import {
  clearEnclosingPricingOverrides,
  loadEnclosingPricingOverrides,
  saveEnclosingPricingOverrides,
} from '@/domain/enclosing/model/enclosing-pricing-overrides'
import { calculatePurlin, type PurlinCalculationResult } from '@/domain/purlin/model/calculate-purlin'
import { calculateTruss, type TrussCalculationResult } from '@/domain/truss/model/calculate-truss'
import insiLogoUrl from '@/assets/insi-logo.png'
import { useCalculatorStore } from '../model/calculator-store'
import { mapToColumnInput, mapToPurlinInput, mapToTrussInput } from '../model/input-mapper'
import type { UnifiedInputState } from '../model/unified-input'
import { ResultsPanel } from './results-panel'
import { UnifiedInputPanel } from './unified-input-panel'

interface CalculatorPageProps {
  initialDomain: DomainTab
  onBack?: () => void
}

type ColumnGroupKey = 'extreme' | 'fachwerk' | 'middle'
type CalculationState<T> = { result: T | null; error: string | null }
type ThemeMode = 'light' | 'dark'
const THEME_STORAGE_KEY = 'metalcalc-theme'

interface PriceImportStatus {
  isLoading: boolean
  message: string | null
  error: string | null
  sourceFileName: string | null
  importedAtIso: string | null
}

const PROFILE_FIELD_BY_GROUP: Record<
  ColumnGroupKey,
  keyof Pick<
    UnifiedInputState,
    'selectedProfileExtreme' | 'selectedProfileFachwerk' | 'selectedProfileMiddle'
  >
> = {
  extreme: 'selectedProfileExtreme',
  fachwerk: 'selectedProfileFachwerk',
  middle: 'selectedProfileMiddle',
}

export function CalculatorPage({ initialDomain, onBack }: CalculatorPageProps) {
  const [activeTab, setActiveTab] = useState<DomainTab>(initialDomain)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const { input, setField, setFields } = useCalculatorStore()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])
  const safeCalculatePurlin = (nextInput: UnifiedInputState): CalculationState<PurlinCalculationResult> => {
    try {
      return {
        result: calculatePurlin(mapToPurlinInput(nextInput)),
        error: null,
      }
    } catch (error) {
      console.warn('Purlin calculation failed:', error)
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Ошибка расчета прогонов',
      }
    }
  }

  const safeCalculateColumn = (nextInput: UnifiedInputState): CalculationState<ColumnCalculationResult> => {
    try {
      return {
        result: calculateColumn(mapToColumnInput(nextInput)),
        error: null,
      }
    } catch (error) {
      console.warn('Column calculation failed:', error)
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Ошибка расчета колонн',
      }
    }
  }

  const safeCalculateTruss = (
    nextInput: UnifiedInputState,
    purlinState: CalculationState<PurlinCalculationResult>,
  ): CalculationState<TrussCalculationResult> => {
    if (!purlinState.result) {
      return {
        result: null,
        error: purlinState.error ?? 'Ошибка расчета прогонов не позволяет рассчитать фермы',
      }
    }

    try {
      return {
        result: calculateTruss(mapToTrussInput(nextInput, purlinState.result)),
        error: null,
      }
    } catch (error) {
      console.warn('Truss calculation failed:', error)
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Ошибка расчета ферм',
      }
    }
  }

  const [initialPurlinState] = useState(() => safeCalculatePurlin(input))
  const [initialTrussState] = useState(() => safeCalculateTruss(input, initialPurlinState))
  const [initialColumnState] = useState(() => safeCalculateColumn(input))
  const [purlinResult, setPurlinResult] = useState<PurlinCalculationResult | null>(initialPurlinState.result)
  const [trussResult, setTrussResult] = useState<TrussCalculationResult | null>(initialTrussState.result)
  const [columnResult, setColumnResult] = useState<ColumnCalculationResult | null>(initialColumnState.result)
  const [purlinError, setPurlinError] = useState<string | null>(initialPurlinState.error)
  const [trussError, setTrussError] = useState<string | null>(initialTrussState.error)
  const [columnError, setColumnError] = useState<string | null>(initialColumnState.error)
  const [priceImportStatus, setPriceImportStatus] = useState<PriceImportStatus>(() => {
    const persisted = loadEnclosingPricingOverrides()
    return {
      isLoading: false,
      message: persisted ? 'Используются импортированные цены прайса.' : null,
      error: null,
      sourceFileName: persisted?.sourceFileName ?? null,
      importedAtIso: persisted?.importedAtIso ?? null,
    }
  })

  const recalculate = (nextInput: UnifiedInputState) => {
    const nextPurlinState = safeCalculatePurlin(nextInput)
    setPurlinResult(nextPurlinState.result)
    setPurlinError(nextPurlinState.error)

    const nextTrussState = safeCalculateTruss(nextInput, nextPurlinState)
    setTrussResult(nextTrussState.result)
    setTrussError(nextTrussState.error)

    const nextColumnState = safeCalculateColumn(nextInput)
    setColumnResult(nextColumnState.result)
    setColumnError(nextColumnState.error)
  }

  const handleFieldChange = <K extends keyof UnifiedInputState>(key: K, value: UnifiedInputState[K]) => {
    setField(key, value)
    const nextInput = { ...input, [key]: value }
    startTransition(() => recalculate(nextInput))
  }

  const handleFieldsChange = (patch: Partial<UnifiedInputState>) => {
    setFields(patch)
    const nextInput = { ...input, ...patch }
    startTransition(() => recalculate(nextInput))
  }

  const handleColumnManualModeChange = (isManualMode: boolean) => {
    if (isManualMode) {
      handleFieldsChange({ isManualMode: true })
      return
    }

    handleFieldsChange({
      isManualMode: false,
      selectedProfileExtreme: 0,
      selectedProfileFachwerk: 0,
      selectedProfileMiddle: 0,
    })
  }

  const handleColumnSelectionModeChange = (
    mode: UnifiedInputState['columnSelectionMode'],
  ) => {
    handleFieldChange('columnSelectionMode', mode)
  }

  const handleColumnProfileSelection = (group: ColumnGroupKey, selectedIndex: number) => {
    const field = PROFILE_FIELD_BY_GROUP[group]
    handleFieldChange(field, selectedIndex)
  }

  const handlePurlinSpecificationSourceChange = (
    source: UnifiedInputState['purlinSpecificationSource'],
  ) => {
    handleFieldChange('purlinSpecificationSource', source)
  }

  const handlePurlinSelectionModeChange = (mode: UnifiedInputState['purlinSelectionMode']) => {
    handleFieldChange('purlinSelectionMode', mode)
  }

  const handleSortPurlinSelect = (selectedIndex: number) => {
    handleFieldChange('selectedSortPurlinIndex', selectedIndex)
  }

  const handleLstkPurlinSelect = (selectedIndex: number) => {
    handleFieldChange('selectedLstkPurlinIndex', selectedIndex)
  }

  const handlePricePdfImport = async (file: File) => {
    setPriceImportStatus((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      message: null,
    }))

    try {
      const parsed = await parseEnclosingPricingValuesFromPdfFile(file)
      if (parsed.extractedFields.length === 0) {
        throw new Error('Не удалось извлечь цены из PDF. Проверьте формат прайса.')
      }

      const importedAtIso = new Date().toISOString()
      saveEnclosingPricingOverrides({
        sourceFileName: file.name,
        importedAtIso,
        values: parsed.values,
      })

      setPriceImportStatus({
        isLoading: false,
        message: `Импортировано полей цен: ${parsed.extractedFields.length}.`,
        error: null,
        sourceFileName: file.name,
        importedAtIso,
      })
      startTransition(() => recalculate(input))
    } catch (error) {
      setPriceImportStatus((prev) => ({
        ...prev,
        isLoading: false,
        message: null,
        error: error instanceof Error ? error.message : 'Ошибка импорта прайса.',
      }))
    }
  }

  const handlePriceOverridesReset = () => {
    clearEnclosingPricingOverrides()
    setPriceImportStatus({
      isLoading: false,
      message: 'Импортированные цены сброшены. Используются базовые значения.',
      error: null,
      sourceFileName: null,
      importedAtIso: null,
    })
    startTransition(() => recalculate(input))
  }

  return (
    <div className="app-shell dark-mode-ready" data-testid="calculator-page" data-theme={themeMode}>
      <header className="topbar">
        {onBack && (
          <button className="btn-back" data-testid="back-to-home" onClick={onBack}>
            ← Назад
          </button>
        )}

        <div className="brand-mark" style={{ marginLeft: 16 }}>
          <img className="brand-logo" src={insiLogoUrl} alt="ИНСИ" />
        </div>

        <div className="topbar-actions">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'column' ? 'active' : ''}`}
              data-testid="tab-column"
              onClick={() => setActiveTab('column')}
            >
              Колонны
            </button>
            <button
              className={`tab ${activeTab === 'truss' ? 'active' : ''}`}
              data-testid="tab-truss"
              onClick={() => setActiveTab('truss')}
            >
              Фермы
            </button>
            <button
              className={`tab ${activeTab === 'purlin' ? 'active' : ''}`}
              data-testid="tab-purlin"
              onClick={() => setActiveTab('purlin')}
            >
              Прогоны
            </button>
            <button
              className={`tab ${activeTab === 'selection-summary' ? 'active' : ''}`}
              data-testid="tab-selection-summary"
              onClick={() => setActiveTab('selection-summary')}
            >
              Итог подбора
            </button>
            <button
              className={`tab ${activeTab === 'enclosing' ? 'active' : ''}`}
              data-testid="tab-enclosing"
              onClick={() => setActiveTab('enclosing')}
            >
              Ограждающие конструкции
            </button>
            <button
              className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
              data-testid="tab-summary"
              onClick={() => setActiveTab('summary')}
            >
              Сводная
            </button>
          </div>

          <div className="topbar-utility-group">
            <button
              className={`tab tab--utility ${activeTab === 'methodology' ? 'active' : ''}`}
              data-testid="tab-methodology"
              onClick={() => setActiveTab('methodology')}
            >
              Методика
            </button>

            <div className="theme-toggle" role="group" aria-label="Переключение темы">
              <button
                className={`theme-button ${themeMode === 'light' ? 'active' : ''}`}
                data-testid="theme-light"
                onClick={() => setThemeMode('light')}
              >
                Светлая
              </button>
              <button
                className={`theme-button ${themeMode === 'dark' ? 'active' : ''}`}
                data-testid="theme-dark"
                onClick={() => setThemeMode('dark')}
              >
                Тёмная
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="split-view">
        <div className="split-left">
          <UnifiedInputPanel input={input} onChange={handleFieldChange} />
        </div>

        <div className="split-right">
          <ResultsPanel
            input={input}
            activeTab={activeTab}
            purlinResult={purlinResult}
            trussResult={trussResult}
            columnResult={columnResult}
            isPending={isPending}
            purlinError={purlinError}
            trussError={trussError}
            columnError={columnError}
            isColumnManualMode={input.isManualMode}
            onColumnManualModeChange={handleColumnManualModeChange}
            columnSelectionMode={input.columnSelectionMode}
            onColumnSelectionModeChange={handleColumnSelectionModeChange}
            onColumnProfileSelect={handleColumnProfileSelection}
            purlinSpecificationSource={input.purlinSpecificationSource}
            onPurlinSpecificationSourceChange={handlePurlinSpecificationSourceChange}
            purlinSelectionMode={input.purlinSelectionMode}
            onPurlinSelectionModeChange={handlePurlinSelectionModeChange}
            selectedSortPurlinIndex={input.selectedSortPurlinIndex}
            selectedLstkPurlinIndex={input.selectedLstkPurlinIndex}
            onSortPurlinSelect={handleSortPurlinSelect}
            onLstkPurlinSelect={handleLstkPurlinSelect}
            onImportPricePdf={handlePricePdfImport}
            onResetPriceOverrides={handlePriceOverridesReset}
            priceImportStatus={priceImportStatus}
          />
        </div>
      </div>
    </div>
  )
}
