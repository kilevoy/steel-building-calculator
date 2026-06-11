import { useMemo, useState, type ChangeEvent } from 'react'
import insiLogoUrl from '@/assets/insi-logo.png'
import {
  calculateCraneBeam,
  craneBeamBrakeStructureOptions,
  craneBeamCapacityOptions,
  craneBeamCountInSpanOptions,
  craneBeamDutyOptions,
  craneBeamLookupModeOptions,
  craneBeamRailTypeOptions,
  craneBeamSuspensionTypeOptions,
  defaultCraneBeamInput,
  type CraneBeamInput,
} from '@/domain/crane-beam/model/calculate-crane-beam'

interface CraneBeamDemoPageProps {
  backHref: string
  methodologyHref: string
}

function formatNumber(value: number, digits = 3) {
  return value.toFixed(digits).replace('.', ',')
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function CraneBeamDemoPage({ backHref, methodologyHref }: CraneBeamDemoPageProps) {
  const [input, setInput] = useState<CraneBeamInput>(defaultCraneBeamInput)
  const [priceRubPerKg, setPriceRubPerKg] = useState(155.88)
  const result = useMemo(() => calculateCraneBeam(input), [input])
  const isCatalogMode = input.lookupMode === 'catalog'
  const totalCostRub = result.selection.profile ? result.selection.weightKg * priceRubPerKg : 0

  const updateNumber =
    <K extends keyof CraneBeamInput>(key: K) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseNumber(event.target.value)
      if (parsed === null) {
        return
      }

      setInput((current) => ({
        ...current,
        [key]: key === 'wheelCount' ? Math.max(1, Math.trunc(parsed)) : parsed,
      }))
    }

  return (
    <div className="app-shell">
      <main
        data-testid="crane-beam-demo-page"
        className="page"
        style={{ display: 'grid', gap: 16, maxWidth: 'none', padding: '24px 0 56px' }}
      >
        <section
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            padding: '12px 18px',
            borderRadius: 16,
            background: '#ffffff',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <img src={insiLogoUrl} alt="INSI" style={{ width: 96, height: 96, objectFit: 'contain' }} />
            <div style={{ display: 'grid', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.05, color: '#0f172a' }}>
                Подбор прокатной подкрановой балки
              </h1>
              <div style={{ color: '#475569', maxWidth: 720 }}>
                Восстановленная demo-страница из старой published-сборки. Основной подбор берется из
                workbook-каталога, а расчетные усилия считаются в приложении.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={methodologyHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 10,
                background: '#fff7ed',
                color: '#9a3412',
                border: '1px solid rgba(249, 115, 22, 0.28)',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Методика
            </a>
            <a
              href={backHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 10,
                background: '#eef2f6',
                color: '#334155',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Открыть основной калькулятор
            </a>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 18,
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 0.9fr)',
            alignItems: 'start',
          }}
        >
          <article
            style={{
              display: 'grid',
              gap: 14,
              padding: 18,
              borderRadius: 16,
              background: '#ffffff',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div
              className="crane-beam-lookup-grid"
              style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Источник паспортных данных</span>
                <select
                  value={input.lookupMode}
                  onChange={(event) => setInput((current) => ({ ...current, lookupMode: event.target.value }))}
                >
                  {craneBeamLookupModeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'catalog' ? 'Из каталога' : 'Ручной ввод'}
                    </option>
                  ))}
                </select>
              </label>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: isCatalogMode ? '#eff6ff' : '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  color: '#334155',
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {isCatalogMode
                  ? 'Для типовых сочетаний паспорт крана и рельса подставляется автоматически.'
                  : 'В ручном режиме можно ввести нестандартные паспортные данные и проверить усилия.'}
              </div>
            </div>

            <div
              className="crane-beam-form-grid"
              style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Грузоподъемность, т</span>
                <select
                  value={String(input.loadCapacityT)}
                  onChange={(event) =>
                    setInput((current) => ({
                      ...current,
                      loadCapacityT:
                        craneBeamCapacityOptions.find((option) => String(option) === event.target.value) ??
                        current.loadCapacityT,
                    }))
                  }
                >
                  {craneBeamCapacityOptions.map((option) => (
                    <option key={String(option)} value={String(option)}>
                      {String(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Пролет крана, м</span>
                <input value={formatNumber(input.craneSpanM, 1)} onChange={updateNumber('craneSpanM')} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Число колес</span>
                <input value={String(input.wheelCount)} onChange={updateNumber('wheelCount')} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Тип подвеса</span>
                <select
                  value={input.suspensionType}
                  onChange={(event) =>
                    setInput((current) => ({ ...current, suspensionType: event.target.value }))
                  }
                >
                  {craneBeamSuspensionTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Группа режима работы</span>
                <select
                  value={input.dutyGroup}
                  onChange={(event) => setInput((current) => ({ ...current, dutyGroup: event.target.value }))}
                >
                  {craneBeamDutyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Количество кранов в пролете</span>
                <select
                  value={input.craneCountInSpan}
                  onChange={(event) =>
                    setInput((current) => ({ ...current, craneCountInSpan: event.target.value }))
                  }
                >
                  {craneBeamCountInSpanOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Подкрановый рельс</span>
                <select
                  value={input.craneRail}
                  onChange={(event) => setInput((current) => ({ ...current, craneRail: event.target.value }))}
                >
                  {craneBeamRailTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Пролет ПБ, м</span>
                <input value={formatNumber(input.beamSpanM, 1)} onChange={updateNumber('beamSpanM')} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Тормозная конструкция</span>
                <select
                  value={input.brakeStructure}
                  onChange={(event) =>
                    setInput((current) => ({ ...current, brakeStructure: event.target.value }))
                  }
                >
                  {craneBeamBrakeStructureOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Шаг ребер, м</span>
                <input value={formatNumber(input.stiffenerStepM, 1)} onChange={updateNumber('stiffenerStepM')} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Цена за кг, ₽</span>
                <input
                  value={formatNumber(priceRubPerKg, 2)}
                  onChange={(event) => {
                    const parsed = parseNumber(event.target.value)
                    if (parsed !== null && parsed >= 0) {
                      setPriceRubPerKg(parsed)
                    }
                  }}
                />
              </label>
            </div>

            <section style={{ display: 'grid', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Паспорт крана и рельса</h2>
              <div
                className="crane-beam-form-grid"
                style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
              >
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>Нагрузка на колесо, кН</span>
                  <input
                    disabled={isCatalogMode}
                    value={formatNumber(isCatalogMode ? result.lookup.wheelLoadKn : input.wheelLoadKn, 3)}
                    onChange={updateNumber('wheelLoadKn')}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>Масса тележки крана, т</span>
                  <input
                    disabled={isCatalogMode}
                    value={formatNumber(isCatalogMode ? result.lookup.trolleyMassT : input.trolleyMassT, 3)}
                    onChange={updateNumber('trolleyMassT')}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>База крана, мм</span>
                  <input
                    disabled={isCatalogMode}
                    value={formatNumber(isCatalogMode ? result.lookup.craneBaseMm : input.craneBaseMm, 0)}
                    onChange={updateNumber('craneBaseMm')}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>Габарит крана, мм</span>
                  <input
                    disabled={isCatalogMode}
                    value={formatNumber(isCatalogMode ? result.lookup.craneGaugeMm : input.craneGaugeMm, 0)}
                    onChange={updateNumber('craneGaugeMm')}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>Ширина подошвы рельса, м</span>
                  <input
                    disabled={isCatalogMode}
                    value={formatNumber(isCatalogMode ? result.lookup.railFootWidthM : input.railFootWidthM, 3)}
                    onChange={updateNumber('railFootWidthM')}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>Высота рельса, м</span>
                  <input
                    disabled={isCatalogMode}
                    value={formatNumber(isCatalogMode ? result.lookup.railHeightM : input.railHeightM, 3)}
                    onChange={updateNumber('railHeightM')}
                  />
                </label>
              </div>
            </section>
          </article>

          <article
            style={{
              display: 'grid',
              gap: 14,
              padding: 18,
              borderRadius: 16,
              background: 'linear-gradient(180deg, #f8fafc 0%, #f2f6fa 100%)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Результат подбора</h2>
            <div style={{ display: 'grid', gap: 8, padding: 14, borderRadius: 12, background: '#ffffff' }}>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Профиль
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: '#0f172a' }}>
                {result.selection.profile || '—'}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: '#334155' }}>
                <span>Вес: <strong>{formatNumber(result.selection.weightKg, 3)}</strong> кг</span>
                <span>К-т использования: <strong>{formatNumber(result.selection.utilization, 3)}</strong></span>
              </div>
            </div>

            <div
              className="crane-beam-profile-grid"
              style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <section style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, background: '#ffffff' }}>
                <strong>Параметры профиля</strong>
                <div>Тип: {result.selection.profileDetails.sectionType || '—'}</div>
                <div>Серия: {result.selection.profileDetails.profileSeries || '—'}</div>
                <div>Высота h: {result.selection.profileDetails.actualHeightMm ?? '—'} мм</div>
                <div>Ширина b: {result.selection.profileDetails.flangeWidthMm ?? '—'} мм</div>
                <div>tw: {result.selection.profileDetails.webThicknessMm ?? '—'} мм</div>
                <div>tf: {result.selection.profileDetails.flangeThicknessMm ?? '—'} мм</div>
                <div>Ry: {result.selection.profileDetails.designResistanceRyMpa ? formatNumber(result.selection.profileDetails.designResistanceRyMpa, 1) : '—'} МПа</div>
              </section>

              <section style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, background: '#ffffff' }}>
                <strong>Поставка и стоимость</strong>
                <div>Длина балки: {formatNumber(input.beamSpanM, 1)} м</div>
                <div>Общая масса: {formatNumber(result.selection.weightKg, 1)} кг</div>
                <div>Цена за кг: {formatNumber(priceRubPerKg, 2)} ₽/кг</div>
                <div>Ориентировочная стоимость: {totalCostRub ? totalCostRub.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '0'} ₽</div>
              </section>
            </div>

            <section style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 12, background: '#ffffff' }}>
              <strong>Расчетные усилия</strong>
              <div className="crane-beam-loads-grid" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div>Mx: {formatNumber(result.loads.designMxGeneralKnM, 3)} кН·м</div>
                <div>My: {formatNumber(result.loads.designMyGeneralKnM, 3)} кН·м</div>
                <div>Q: {formatNumber(result.loads.designQGeneralKn, 3)} кН</div>
                <div>Qдоп: {formatNumber(result.loads.designQAdditionalKn, 3)} кН</div>
                <div>Mt local: {formatNumber(result.loads.designMtLocalKnM, 3)} кН·м</div>
              </div>
            </section>

            <section style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 12, background: '#ffffff' }}>
              <strong>Производные коэффициенты</strong>
              <div className="crane-beam-metric-grid" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <div>Tbн: {formatNumber(result.derived.tbnKn, 3)}</div>
                <div>Qbн: {formatNumber(result.derived.qbnKn, 3)}</div>
                <div>gamma local: {formatNumber(result.derived.gammaLocal, 3)}</div>
                <div>nvyn: {formatNumber(result.derived.fatigueNvyn, 3)}</div>
                <div>alpha: {formatNumber(result.derived.alpha, 3)}</div>
                <div>Случай 2 кранов: {result.derived.caseForTwoCranes}</div>
              </div>
            </section>
          </article>
        </section>
      </main>
    </div>
  )
}
