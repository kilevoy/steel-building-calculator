import { useState, useMemo } from 'react'
import { calculateColumn } from '@/domain/column/model/calculate-column'
import { defaultColumnInput, type ColumnInput } from '@/domain/column/model/column-input'
import {
  columnCityLoads,
  columnCoveringCatalog,
  columnSupportCraneCatalog,
} from '@/domain/column/model/column-reference.generated'
import { Field } from './field'
import { CandidatesTable } from '@/pages/calculator/ui/candidates-table'

const CITIES = columnCityLoads.map((c) => c.city)
const ROOF_COVERINGS = columnCoveringCatalog.map((c) => c.name)
const SUPPORT_CRANE_CAPACITIES = Array.from(
  new Set(columnSupportCraneCatalog.map((c) => c.capacityLabel)),
)

const TERRAIN_TYPES = ['А', 'В', 'С']
const ROOF_TYPES = ['двускатная', 'односкатная']
const COLUMN_TYPES = ['крайняя', 'средняя', 'фахверковая']
const SPANS_COUNT = ['один', 'более одного']
const BRACING_OPTIONS = ['нет', 'есть']
const CRANE_MODES = ['нет', 'есть']
const CRANE_SPAN_MODES = ['да', 'нет']
const CRANE_COUNTS = ['один', 'два']
const RESPONSIBILITY_LEVELS = ['0.8', '1', '1.2']

interface ColumnPageProps {
  onBack: () => void
}

export function ColumnPage({ onBack }: ColumnPageProps) {
  const [input, setInput] = useState<ColumnInput>(defaultColumnInput)

  const result = useMemo(() => {
    try {
      return { value: calculateColumn(input), error: null }
    } catch (e) {
      return { value: null, error: String(e) }
    }
  }, [input])

  function setNum(key: keyof ColumnInput, value: string) {
    const n = parseFloat(value.replace(',', '.'))
    setInput((prev) => ({ ...prev, [key]: isNaN(n) ? 0 : n }))
  }

  function setStr(key: keyof ColumnInput, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  const ctx = result.value?.derivedContext

  return (
    <div className="app-shell">
      <div className="page">
        <header className="topbar">
          <button id="btn-back-column" className="back-button" onClick={onBack}>
            ← Назад
          </button>
          <div className="brand-mark">
            <div className="brand-seal">MC</div>
            <div className="brand-copy">
              <p className="eyebrow">Калькулятор</p>
              <strong className="brand-title">Подбор колонн</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="chip">
              <strong>{input.city}</strong>
            </span>
            {ctx && (
              <span className="chip">
                N&nbsp;<strong>{ctx.axialLoadKn.toFixed(0)} кН</strong>
              </span>
            )}
          </div>
        </header>

        <div className="calc-layout">
          {/* ─── Form ─── */}
          <div className="panel calc-form">
            {/* Building */}
            <div className="form-section">
              <h3 className="form-section-title">Здание</h3>

              <Field label="Город" id="col-city">
                <select
                  id="col-city"
                  className="field-select"
                  value={input.city}
                  onChange={(e) => setStr('city', e.target.value)}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="field-row">
                <Field label="Тип кровли" id="col-roofType">
                  <select
                    id="col-roofType"
                    className="field-select"
                    value={input.roofType}
                    onChange={(e) => setStr('roofType', e.target.value)}
                  >
                    {ROOF_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ответственность" id="col-respLevel">
                  <select
                    id="col-respLevel"
                    className="field-select"
                    value={input.responsibilityLevel}
                    onChange={(e) => setStr('responsibilityLevel', e.target.value)}
                  >
                    {RESPONSIBILITY_LEVELS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="field-row">
                <Field label="Пролёт, м" id="col-spanM">
                  <input
                    id="col-spanM"
                    type="number"
                    className="field-input"
                    value={input.spanM}
                    min={6}
                    step={0.5}
                    onChange={(e) => setNum('spanM', e.target.value)}
                  />
                </Field>
                <Field label="Длина здания, м" id="col-buildingLengthM">
                  <input
                    id="col-buildingLengthM"
                    type="number"
                    className="field-input"
                    value={input.buildingLengthM}
                    min={6}
                    step={1}
                    onChange={(e) => setNum('buildingLengthM', e.target.value)}
                  />
                </Field>
              </div>

              <div className="field-row">
                <Field label="Высота, м" id="col-buildingHeightM">
                  <input
                    id="col-buildingHeightM"
                    type="number"
                    className="field-input"
                    value={input.buildingHeightM}
                    min={3}
                    step={0.5}
                    onChange={(e) => setNum('buildingHeightM', e.target.value)}
                  />
                </Field>
                <Field label="Уклон кровли, °" id="col-roofSlopeDeg">
                  <input
                    id="col-roofSlopeDeg"
                    type="number"
                    className="field-input"
                    value={input.roofSlopeDeg}
                    min={0}
                    max={60}
                    step={0.5}
                    onChange={(e) => setNum('roofSlopeDeg', e.target.value)}
                  />
                </Field>
              </div>

              <div className="field-row">
                <Field label="Шаг рам, м" id="col-frameStepM">
                  <input
                    id="col-frameStepM"
                    type="number"
                    className="field-input"
                    value={input.frameStepM}
                    min={1}
                    step={0.5}
                    onChange={(e) => setNum('frameStepM', e.target.value)}
                  />
                </Field>
                <Field label="Шаг фасадных колонн, м" id="col-facadeColumnStepM">
                  <input
                    id="col-facadeColumnStepM"
                    type="number"
                    className="field-input"
                    value={input.facadeColumnStepM}
                    min={1}
                    step={0.5}
                    onChange={(e) => setNum('facadeColumnStepM', e.target.value)}
                  />
                </Field>
              </div>

              <div className="field-row">
                <Field label="Тип колонны" id="col-columnType">
                  <select
                    id="col-columnType"
                    className="field-select"
                    value={input.columnType}
                    onChange={(e) => setStr('columnType', e.target.value)}
                  >
                    {COLUMN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Местность" id="col-terrainType">
                  <select
                    id="col-terrainType"
                    className="field-select"
                    value={input.terrainType}
                    onChange={(e) => setStr('terrainType', e.target.value)}
                  >
                    {TERRAIN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="field-row">
                <Field label="Количество пролётов" id="col-spansCount">
                  <select
                    id="col-spansCount"
                    className="field-select"
                    value={input.spansCount}
                    onChange={(e) => setStr('spansCount', e.target.value)}
                  >
                    {SPANS_COUNT.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Периметральные связи" id="col-perimeterBracing">
                  <select
                    id="col-perimeterBracing"
                    className="field-select"
                    value={input.perimeterBracing}
                    onChange={(e) => setStr('perimeterBracing', e.target.value)}
                  >
                    {BRACING_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="field-row">
                <Field label="Кровля (тип ограждения)" id="col-roofCovering">
                  <select
                    id="col-roofCovering"
                    className="field-select"
                    value={input.roofCoveringType}
                    onChange={(e) => setStr('roofCoveringType', e.target.value)}
                  >
                    {ROOF_COVERINGS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Стена (тип ограждения)" id="col-wallCovering">
                  <select
                    id="col-wallCovering"
                    className="field-select"
                    value={input.wallCoveringType}
                    onChange={(e) => setStr('wallCoveringType', e.target.value)}
                  >
                    {ROOF_COVERINGS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Доп. нагрузка, %" id="col-extraLoad">
                <input
                  id="col-extraLoad"
                  type="number"
                  className="field-input"
                  value={input.extraLoadPercent}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(e) => setNum('extraLoadPercent', e.target.value)}
                />
              </Field>
            </div>

            {/* Support crane */}
            <div className="form-section">
              <h3 className="form-section-title">Опорный кран</h3>
              <div className="field-row">
                <Field label="Наличие" id="col-supportCraneMode">
                  <select
                    id="col-supportCraneMode"
                    className="field-select"
                    value={input.supportCraneMode}
                    onChange={(e) => setStr('supportCraneMode', e.target.value)}
                  >
                    {CRANE_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Грузоподъёмность, т" id="col-supportCraneCapacity">
                  <select
                    id="col-supportCraneCapacity"
                    className="field-select"
                    value={input.supportCraneCapacity}
                    onChange={(e) => setStr('supportCraneCapacity', e.target.value)}
                    disabled={input.supportCraneMode === 'нет'}
                  >
                    {SUPPORT_CRANE_CAPACITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {input.supportCraneMode === 'есть' && (
                <div className="field-row">
                  <Field label="Количество кранов" id="col-supportCraneCount">
                    <select
                      id="col-supportCraneCount"
                      className="field-select"
                      value={input.supportCraneCount}
                      onChange={(e) => setStr('supportCraneCount', e.target.value)}
                    >
                      {CRANE_COUNTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Уровень рельса, м" id="col-supportCraneRailLevelM">
                    <input
                      id="col-supportCraneRailLevelM"
                      type="number"
                      className="field-input"
                      value={input.supportCraneRailLevelM}
                      min={0}
                      step={0.5}
                      onChange={(e) => setNum('supportCraneRailLevelM', e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Hanging crane */}
            <div className="form-section">
              <h3 className="form-section-title">Подвесной кран</h3>
              <div className="field-row">
                <Field label="Наличие" id="col-hangingCraneMode">
                  <select
                    id="col-hangingCraneMode"
                    className="field-select"
                    value={input.hangingCraneMode}
                    onChange={(e) => setStr('hangingCraneMode', e.target.value)}
                  >
                    {CRANE_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Грузоподъёмность, т" id="col-hangingCraneCapacityT">
                  <input
                    id="col-hangingCraneCapacityT"
                    type="number"
                    className="field-input"
                    value={input.hangingCraneCapacityT}
                    min={0}
                    step={0.5}
                    disabled={input.hangingCraneMode === 'нет'}
                    onChange={(e) => setNum('hangingCraneCapacityT', e.target.value)}
                  />
                </Field>
              </div>

              {input.hangingCraneMode === 'есть' && (
                <Field label="Однопролётный" id="col-hangingCraneSpanMode">
                  <select
                    id="col-hangingCraneSpanMode"
                    className="field-select"
                    value={input.hangingCraneSingleSpanMode}
                    onChange={(e) => setStr('hangingCraneSingleSpanMode', e.target.value)}
                  >
                    {CRANE_SPAN_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            {/* Prices */}
            <div className="form-section">
              <h3 className="form-section-title">Цены (₽/кг)</h3>
              <div className="field-row">
                <Field label="Двутавр С255" id="col-iBeamS255Price">
                  <input
                    id="col-iBeamS255Price"
                    type="number"
                    className="field-input"
                    value={input.iBeamS255PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('iBeamS255PriceRubPerKg', e.target.value)}
                  />
                </Field>
                <Field label="Двутавр С355" id="col-iBeamS355Price">
                  <input
                    id="col-iBeamS355Price"
                    type="number"
                    className="field-input"
                    value={input.iBeamS355PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('iBeamS355PriceRubPerKg', e.target.value)}
                  />
                </Field>
              </div>
              <div className="field-row">
                <Field label="Труба С245" id="col-tubeS245Price">
                  <input
                    id="col-tubeS245Price"
                    type="number"
                    className="field-input"
                    value={input.tubeS245PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('tubeS245PriceRubPerKg', e.target.value)}
                  />
                </Field>
                <Field label="Труба С345" id="col-tubeS345Price">
                  <input
                    id="col-tubeS345Price"
                    type="number"
                    className="field-input"
                    value={input.tubeS345PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('tubeS345PriceRubPerKg', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* ─── Results ─── */}
          <div className="panel calc-results">
            {result.error ? (
              <div className="results-error">
                <p>
                  <strong>Ошибка расчёта</strong>
                </p>
                <p>{result.error}</p>
              </div>
            ) : result.value && ctx ? (
              <>
                {/* Loads overview */}
                <div className="results-section">
                  <h3 className="results-section-title">Нагрузки на колонну</h3>
                  <div className="load-grid">
                    <div className="load-tile">
                      <span>Снег норм.</span>
                      <strong>{ctx.snowLoadKpa.toFixed(2)} кПа</strong>
                    </div>
                    <div className="load-tile">
                      <span>Ветер норм.</span>
                      <strong>{ctx.windLoadKpa.toFixed(2)} кПа</strong>
                    </div>
                    <div className="load-tile">
                      <span>Ветер расч. (момент)</span>
                      <strong>{ctx.designWindForMomentKpa.toFixed(3)} кПа</strong>
                    </div>
                    <div className="load-tile">
                      <span>Снег расч.</span>
                      <strong>{ctx.designSnowLoadKpa.toFixed(3)} кПа</strong>
                    </div>
                    {ctx.supportCraneVerticalLoadKn > 0 && (
                      <div className="load-tile">
                        <span>Кран верт.</span>
                        <strong>{ctx.supportCraneVerticalLoadKn.toFixed(1)} кН</strong>
                      </div>
                    )}
                    {ctx.hangingCraneVerticalLoadKn > 0 && (
                      <div className="load-tile">
                        <span>Подв. кран</span>
                        <strong>{ctx.hangingCraneVerticalLoadKn.toFixed(1)} кН</strong>
                      </div>
                    )}
                    <div className="load-tile load-tile--total">
                      <span>Продольная сила N</span>
                      <strong>{ctx.axialLoadKn.toFixed(1)} кН</strong>
                    </div>
                    <div className="load-tile load-tile--total">
                      <span>Изгибающий момент M</span>
                      <strong>{ctx.bendingMomentKnM.toFixed(1)} кН·м</strong>
                    </div>
                  </div>
                </div>

                <CandidatesTable title="Подобранные профили" candidates={result.value.topCandidates} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
