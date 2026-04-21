import { useState, useMemo } from 'react'
import { calculatePurlin } from '@/domain/purlin/model/calculate-purlin'
import { defaultPurlinInput, type PurlinInput } from '@/domain/purlin/model/purlin-input'
import {
  purlinCityLoads,
  purlinCoveringCatalog,
  purlinProfileSheetIndices,
} from '@/domain/purlin/model/purlin-reference.generated'
import {
  calculatePurlinDesignLoad,
  calculatePurlinDesignSnowLoad,
  calculatePurlinServiceLoad,
  calculatePurlinWindPressure,
} from '@/domain/purlin/model/purlin-load-chain'
import { buildPurlinDerivedContext } from '@/domain/purlin/model/purlin-derived-context'
import { Field } from './field'
import { CandidatesTable } from '@/pages/calculator/ui/candidates-table'

const CITIES = purlinCityLoads.map((c) => c.city)
const COVERINGS = purlinCoveringCatalog.map((c) => c.name)
const PROFILE_SHEETS = purlinProfileSheetIndices.map((p) => p.profileSheet)
const NORMATIVE_MODES = ['по СП 20.13330.20ХХ', 'по СП РК EN']
const ROOF_TYPES = ['односкатная', 'двускатная']
const TERRAIN_TYPES = ['А', 'В', 'С']
const SNOW_BAG_MODES = ['нет', 'вдоль здания', 'поперёк здания']
const RESPONSIBILITY_LEVELS = ['0.8', '1', '1.2']
const TIES_SETTINGS = ['нет', '1', '2', '3']
const YES_NO = ['нет', 'да']

interface PurlinPageProps {
  onBack: () => void
}

export function PurlinPage({ onBack }: PurlinPageProps) {
  const [input, setInput] = useState<PurlinInput>(defaultPurlinInput)

  const result = useMemo(() => {
    try {
      return { value: calculatePurlin(input), error: null }
    } catch (e) {
      return { value: null, error: String(e) }
    }
  }, [input])

  const loads = useMemo(() => {
    try {
      const ctx = buildPurlinDerivedContext(input)
      return {
        snow: calculatePurlinDesignSnowLoad(input, ctx),
        wind: calculatePurlinWindPressure(input, ctx),
        service: calculatePurlinServiceLoad(input, ctx),
        total: calculatePurlinDesignLoad(input, ctx),
        ctx,
      }
    } catch {
      return null
    }
  }, [input])

  function setNum(key: keyof PurlinInput, value: string) {
    const n = parseFloat(value.replace(',', '.'))
    setInput((prev) => ({ ...prev, [key]: isNaN(n) ? 0 : n }))
  }

  function setStr(key: keyof PurlinInput, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="app-shell">
      <div className="page">
        <header className="topbar">
          <button id="btn-back-purlin" className="back-button" onClick={onBack}>
            ← Назад
          </button>
          <div className="brand-mark">
            <div className="brand-seal">MC</div>
            <div className="brand-copy">
              <p className="eyebrow">Калькулятор</p>
              <strong className="brand-title">Подбор прогонов</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="chip">
              <strong>{input.city}</strong>
            </span>
            {loads && (
              <span className="chip">
                Σ&nbsp;<strong>{loads.total.toFixed(3)} кПа</strong>
              </span>
            )}
          </div>
        </header>

        <div className="calc-layout">
          {/* ─── Form ─── */}
          <div className="panel calc-form">
            {/* Section: Building */}
            <div className="form-section">
              <h3 className="form-section-title">Здание</h3>
              <Field label="Город" id="city">
                <select
                  id="city"
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

              <Field label="Нормативный режим" id="normativeMode">
                <select
                  id="normativeMode"
                  className="field-select"
                  value={input.normativeMode}
                  onChange={(e) => setStr('normativeMode', e.target.value)}
                >
                  {NORMATIVE_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="field-row">
                <Field label="Тип кровли" id="roofType">
                  <select
                    id="roofType"
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
                <Field label="Ответственность" id="responsibilityLevel">
                  <select
                    id="responsibilityLevel"
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
                <Field label="Пролёт, м" id="spanM">
                  <input
                    id="spanM"
                    type="number"
                    className="field-input"
                    value={input.spanM}
                    min={1}
                    step={0.5}
                    onChange={(e) => setNum('spanM', e.target.value)}
                  />
                </Field>
                <Field label="Длина здания, м" id="buildingLengthM">
                  <input
                    id="buildingLengthM"
                    type="number"
                    className="field-input"
                    value={input.buildingLengthM}
                    min={1}
                    step={1}
                    onChange={(e) => setNum('buildingLengthM', e.target.value)}
                  />
                </Field>
              </div>

              <div className="field-row">
                <Field label="Высота, м" id="buildingHeightM">
                  <input
                    id="buildingHeightM"
                    type="number"
                    className="field-input"
                    value={input.buildingHeightM}
                    min={1}
                    step={0.5}
                    onChange={(e) => setNum('buildingHeightM', e.target.value)}
                  />
                </Field>
                <Field label="Уклон кровли, °" id="roofSlopeDeg">
                  <input
                    id="roofSlopeDeg"
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
                <Field label="Шаг рам, м" id="frameStepM">
                  <input
                    id="frameStepM"
                    type="number"
                    className="field-input"
                    value={input.frameStepM}
                    min={1}
                    step={0.5}
                    onChange={(e) => setNum('frameStepM', e.target.value)}
                  />
                </Field>
                <Field label="Шаг фахверка, м" id="fakhverkSpacingM">
                  <input
                    id="fakhverkSpacingM"
                    type="number"
                    className="field-input"
                    value={input.fakhverkSpacingM}
                    min={1}
                    step={0.5}
                    onChange={(e) => setNum('fakhverkSpacingM', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Тип местности" id="terrainType">
                <select
                  id="terrainType"
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

            {/* Section: Covering & Profile */}
            <div className="form-section">
              <h3 className="form-section-title">Кровля и профнастил</h3>
              <Field label="Тип кровли (нагрузка)" id="coveringType">
                <select
                  id="coveringType"
                  className="field-select"
                  value={input.coveringType}
                  onChange={(e) => setStr('coveringType', e.target.value)}
                >
                  {COVERINGS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Профнастил" id="profileSheet">
                <select
                  id="profileSheet"
                  className="field-select"
                  value={input.profileSheet}
                  onChange={(e) => setStr('profileSheet', e.target.value)}
                >
                  {PROFILE_SHEETS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="field-row">
                <Field label="Снеговой мешок" id="snowBagMode">
                  <select
                    id="snowBagMode"
                    className="field-select"
                    value={input.snowBagMode}
                    onChange={(e) => setStr('snowBagMode', e.target.value)}
                  >
                    {SNOW_BAG_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Стяжки" id="tiesSetting">
                  <select
                    id="tiesSetting"
                    className="field-select"
                    value={input.tiesSetting}
                    onChange={(e) => setStr('tiesSetting', e.target.value)}
                  >
                    {TIES_SETTINGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {input.snowBagMode !== 'нет' && (
                <div className="field-row">
                  <Field label="Перепад высот, м" id="heightDifferenceM">
                    <input
                      id="heightDifferenceM"
                      type="number"
                      className="field-input"
                      value={input.heightDifferenceM}
                      min={0}
                      step={0.5}
                      onChange={(e) => setNum('heightDifferenceM', e.target.value)}
                    />
                  </Field>
                  <Field label="Размер смежного здания, м" id="adjacentBuildingSizeM">
                    <input
                      id="adjacentBuildingSizeM"
                      type="number"
                      className="field-input"
                      value={input.adjacentBuildingSizeM}
                      min={0}
                      step={0.5}
                      onChange={(e) => setNum('adjacentBuildingSizeM', e.target.value)}
                    />
                  </Field>
                </div>
              )}

              <div className="field-row">
                <Field label="Прогон снегостопа" id="snowRetentionPurlin">
                  <select
                    id="snowRetentionPurlin"
                    className="field-select"
                    value={input.snowRetentionPurlin}
                    onChange={(e) => setStr('snowRetentionPurlin', e.target.value)}
                  >
                    {YES_NO.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Прогон барьера" id="barrierPurlin">
                  <select
                    id="barrierPurlin"
                    className="field-select"
                    value={input.barrierPurlin}
                    onChange={(e) => setStr('barrierPurlin', e.target.value)}
                  >
                    {YES_NO.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="field-row">
                <Field label="Макс. шаг (ручной), мм" id="manualMaxStepMm">
                  <input
                    id="manualMaxStepMm"
                    type="number"
                    className="field-input"
                    value={input.manualMaxStepMm}
                    min={0}
                    step={50}
                    onChange={(e) => setNum('manualMaxStepMm', e.target.value)}
                  />
                </Field>
                <Field label="Мин. шаг (ручной), мм" id="manualMinStepMm">
                  <input
                    id="manualMinStepMm"
                    type="number"
                    className="field-input"
                    value={input.manualMinStepMm}
                    min={0}
                    step={50}
                    onChange={(e) => setNum('manualMinStepMm', e.target.value)}
                  />
                </Field>
              </div>
              <div className="field-row">
                <Field label={'\u041c\u0430\u043a\u0441. \u043a-\u0442 \u0438\u0441\u043f.'} id="maxUtilizationRatio">
                  <input
                    id="maxUtilizationRatio"
                    type="number"
                    className="field-input"
                    value={input.maxUtilizationRatio}
                    min={0.01}
                    max={1}
                    step={0.01}
                    onChange={(e) => setNum('maxUtilizationRatio', e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Section: Prices */}
            <div className="form-section">
              <h3 className="form-section-title">Цены (₽/кг)</h3>
              <div className="field-row">
                <Field label="Двутавр С255" id="iBeamS255Price">
                  <input
                    id="iBeamS255Price"
                    type="number"
                    className="field-input"
                    value={input.iBeamS255PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('iBeamS255PriceRubPerKg', e.target.value)}
                  />
                </Field>
                <Field label="Двутавр С355" id="iBeamS355Price">
                  <input
                    id="iBeamS355Price"
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
                <Field label="Труба С245" id="tubeS245Price">
                  <input
                    id="tubeS245Price"
                    type="number"
                    className="field-input"
                    value={input.tubeS245PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('tubeS245PriceRubPerKg', e.target.value)}
                  />
                </Field>
                <Field label="Труба С345" id="tubeS345Price">
                  <input
                    id="tubeS345Price"
                    type="number"
                    className="field-input"
                    value={input.tubeS345PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('tubeS345PriceRubPerKg', e.target.value)}
                  />
                </Field>
              </div>
              <div className="field-row">
                <Field label="Швеллер С245" id="channelS245Price">
                  <input
                    id="channelS245Price"
                    type="number"
                    className="field-input"
                    value={input.channelS245PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('channelS245PriceRubPerKg', e.target.value)}
                  />
                </Field>
                <Field label="Швеллер С345" id="channelS345Price">
                  <input
                    id="channelS345Price"
                    type="number"
                    className="field-input"
                    value={input.channelS345PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('channelS345PriceRubPerKg', e.target.value)}
                  />
                </Field>
              </div>
              <div className="field-row">
                <Field label="Цена ЛСТК МП350" id="lstkMp350Price">
                  <input
                    id="lstkMp350Price"
                    type="number"
                    className="field-input"
                    value={input.lstkMp350PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('lstkMp350PriceRubPerKg', e.target.value)}
                  />
                </Field>
                <Field label="Цена ЛСТК МП390" id="lstkMp390Price">
                  <input
                    id="lstkMp390Price"
                    type="number"
                    className="field-input"
                    value={input.lstkMp390PriceRubPerKg}
                    min={50}
                    step={5}
                    onChange={(e) => setNum('lstkMp390PriceRubPerKg', e.target.value)}
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
            ) : result.value ? (
              <>
                {/* Loads overview */}
                {loads && (
                  <div className="results-section">
                    <h3 className="results-section-title">Нагрузки</h3>
                    <div className="load-grid">
                      <div className="load-tile">
                        <span>Снег (расч.)</span>
                        <strong>{loads.snow.toFixed(3)} кПа</strong>
                      </div>
                      <div className="load-tile">
                        <span>Ветер</span>
                        <strong>{loads.wind.toFixed(3)} кПа</strong>
                      </div>
                      <div className="load-tile">
                        <span>Эксплуатация</span>
                        <strong>{loads.service.toFixed(3)} кПа</strong>
                      </div>
                      <div className="load-tile load-tile--total">
                        <span>Суммарная расчётная</span>
                        <strong>{loads.total.toFixed(3)} кПа</strong>
                      </div>
                    </div>
                    <p className="load-meta">
                      Авт. макс. шаг:&nbsp;<strong>{result.value.autoMaxStepMm} мм</strong>
                      &nbsp;·&nbsp; Кровля:&nbsp;
                      <strong>{loads.ctx.coveringLoadKpa.toFixed(3)} кПа</strong>
                      &nbsp;·&nbsp; Снег нормат.:&nbsp;
                      <strong>{loads.ctx.snowLoadKpa.toFixed(2)} кПа</strong>
                    </p>
                  </div>
                )}

                <CandidatesTable
                  title="Сортовой — ТОП 10"
                  candidates={result.value.sortSteelTop10}
                />
                <CandidatesTable title="ЛСТК МП350" candidates={result.value.lstkMp350Top} />
                <CandidatesTable title="ЛСТК МП390" candidates={result.value.lstkMp390Top} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

