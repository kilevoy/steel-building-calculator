import { useMemo, useState, type ChangeEvent } from 'react'
import insiLogoUrl from '@/assets/insi-logo.png'
import {
  calculateWindowRigel,
  windowRigelCityOptions,
  defaultWindowRigelDemoInput,
  type WindowRigelCalculationResult,
  type WindowRigelInput,
  windowRigelConstructionOptions,
  windowRigelWindowTypeOptions,
} from '../model/calculate-window-rigel'

interface WindowRigelDemoPageProps {
  backHref: string
}

const fieldLabelStyle = { display: 'grid', gap: 4, lineHeight: 1.1 } as const
const fieldInputStyle = {
  minHeight: 42,
  padding: '9px 11px',
  lineHeight: 1.15,
  borderRadius: 10,
  border: '1px solid rgba(100, 116, 139, 0.28)',
  background: '#ffffff',
  color: '#0f172a',
} as const

const formatNumber = (value: number, digits = 3) => value.toFixed(digits).replace('.', ',')
const formatMoney = (value: number) =>
  value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function TypeGlyph({ windowType }: { windowType: number }) {
  const mullionsByType: Record<number, number[]> = {
    1: [],
    2: [0.08, 0.92],
    3: [0.34, 0.66],
    4: [0.5],
    5: [0.74, 0.9],
  }
  const mullions = mullionsByType[windowType] ?? []

  return (
    <svg viewBox="0 0 140 72" width="100%" height="60" aria-hidden="true">
      <line x1="10" y1="18" x2="130" y2="18" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="54" x2="130" y2="54" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="18" x2="130" y2="18" stroke="#7dd3c7" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="54" x2="130" y2="54" stroke="#7dd3c7" strokeWidth="2" strokeLinecap="round" />
      {mullions.map((position, index) => {
        const x = 10 + 120 * position
        return (
          <g key={`${windowType}-${index}`} data-testid={`glyph-mullion-${windowType}-${index + 1}`}>
            <line x1={x} y1="18" x2={x} y2="54" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
            <line x1={x} y1="18" x2={x} y2="54" stroke="#7dd3c7" strokeWidth="2" strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
}

function CandidateCard({
  title,
  candidate,
  windowCount,
  input,
}: {
  title: string
  candidate: WindowRigelCalculationResult['bottomCandidates'][number] | undefined
  windowCount: number
  input: WindowRigelInput
}) {
  if (!candidate) {
    return (
      <article
        style={{
          display: 'grid',
          gap: 10,
          padding: 18,
          borderRadius: 14,
          background: '#ffffff',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div>Подходящий вариант не найден.</div>
      </article>
    )
  }

  const totalMassKg = candidate.massKg * windowCount
  const priceRubPerKg = candidate.steelGrade.trim() === 'С245' ? input.tubeS245PriceRubPerKg : input.tubeS345PriceRubPerKg
  const priceRubPerTon = priceRubPerKg * 1000
  const totalCostRub = totalMassKg * priceRubPerKg

  return (
    <article
      style={{
        display: 'grid',
        gap: 10,
        padding: 18,
        borderRadius: 14,
        background: '#ffffff',
        border: '1px solid rgba(148, 163, 184, 0.18)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>{title}</h3>
      <div style={{ display: 'grid', gap: 6, color: '#334155', lineHeight: 1.4 }}>
        <div>Профиль: {candidate.profile}</div>
        <div>Сталь: {candidate.steelGrade}</div>
        <div>Масса одного ригеля: {formatNumber(candidate.massKg, 4)} кг</div>
        <div>Количество окон: {windowCount}</div>
        <div>Общая масса: {formatNumber(totalMassKg, 0)} кг</div>
        <div>
          Стоимость: {formatMoney(totalCostRub)} руб. ({formatMoney(priceRubPerTon)} руб/т)
        </div>
      </div>
    </article>
  )
}

function RankedCandidate({
  rank,
  candidate,
}: {
  rank: number
  candidate: WindowRigelCalculationResult['bottomCandidates'][number]
}) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        background: '#ffffff',
        border: '1px solid rgba(148, 163, 184, 0.18)',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 16 }}>
          {rank}. {candidate.profile}
        </strong>
        <span style={{ color: '#475569' }}>Сталь: {candidate.steelGrade}</span>
        <span style={{ color: '#475569' }}>Масса: {formatNumber(candidate.massKg, 4)} кг</span>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
        Коэффициенты: гибкость {formatNumber(candidate.utilization.flexibility, 2)} · прочность{' '}
        {formatNumber(candidate.utilization.strength, 2)} · прогиб {formatNumber(candidate.utilization.deflection, 2)}
      </div>
    </div>
  )
}

export function WindowRigelDemoPage({ backHref }: WindowRigelDemoPageProps) {
  const [input, setInput] = useState<WindowRigelInput>(defaultWindowRigelDemoInput)
  const [windowCount, setWindowCount] = useState(() =>
    Math.max(1, Math.round(defaultWindowRigelDemoInput.buildingLengthM / defaultWindowRigelDemoInput.frameStepM)),
  )

  const result = useMemo(() => calculateWindowRigel(input), [input])

  const setNumericField = (key: keyof WindowRigelInput) => (event: ChangeEvent<HTMLInputElement>) => {
    const normalized = event.target.value.trim().replace(',', '.')
    const value = Number(normalized)
    if (!Number.isFinite(value)) {
      return
    }

    setInput((current) => ({ ...current, [key]: key === 'windowType' ? Math.trunc(value) : value }))
  }

  return (
    <div className="app-shell">
      <main
        data-testid="window-rigel-demo-page"
        className="page"
        style={{ display: 'grid', gap: 16, maxWidth: 'none', padding: '28px 0 64px' }}
      >
        <section
          style={{
            display: 'flex',
            gap: 18,
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
            <img src={insiLogoUrl} alt="INSI" style={{ width: 100, height: 100, objectFit: 'contain' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.05, color: '#0f172a' }}>Подбор оконных ригелей</h1>
            </div>
          </div>

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
        </section>

        <section
          style={{
            display: 'grid',
            gap: 18,
            gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 0.95fr)',
            padding: 20,
            borderRadius: 16,
            background: '#ffffff',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              alignItems: 'start',
            }}
          >
            <label style={fieldLabelStyle}>
              <span>Город</span>
              <select
                aria-label="Город"
                style={fieldInputStyle}
                value={input.city}
                onChange={(event) => setInput((current) => ({ ...current, city: event.target.value }))}
              >
                {windowRigelCityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label style={fieldLabelStyle}>
              <span>Высота окна, м</span>
              <input
                aria-label="Высота окна"
                style={fieldInputStyle}
                value={String(input.windowHeightM).replace('.', ',')}
                onChange={setNumericField('windowHeightM')}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Шаг рам, м</span>
              <input
                aria-label="Шаг рам"
                style={fieldInputStyle}
                value={String(input.frameStepM).replace('.', ',')}
                onChange={setNumericField('frameStepM')}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Тип окна</span>
              <input
                aria-label="Тип окна"
                style={fieldInputStyle}
                value={String(input.windowType)}
                onChange={setNumericField('windowType')}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Высота здания, м</span>
              <input
                aria-label="Высота здания"
                style={fieldInputStyle}
                value={String(input.buildingHeightM).replace('.', ',')}
                onChange={setNumericField('buildingHeightM')}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Пролет здания, м</span>
              <input
                aria-label="Пролет здания"
                style={fieldInputStyle}
                value={String(input.buildingSpanM).replace('.', ',')}
                onChange={setNumericField('buildingSpanM')}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Длина здания, м</span>
              <input
                aria-label="Длина здания"
                style={fieldInputStyle}
                value={String(input.buildingLengthM).replace('.', ',')}
                onChange={setNumericField('buildingLengthM')}
              />
            </label>

            <label style={fieldLabelStyle}>
              <span>Количество окон</span>
              <input
                aria-label="Количество окон"
                style={fieldInputStyle}
                value={String(windowCount)}
                onChange={(event) => {
                  const nextValue = Number(event.target.value.trim().replace(',', '.'))
                  if (!Number.isFinite(nextValue)) {
                    return
                  }
                  setWindowCount(Math.max(0, Math.trunc(nextValue)))
                }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <label style={fieldLabelStyle}>
                <span>Конструкция окна</span>
                <select
                  aria-label="Конструкция окна"
                  style={fieldInputStyle}
                  value={input.windowConstruction}
                  onChange={(event) =>
                    setInput((current) => ({ ...current, windowConstruction: event.target.value }))
                  }
                >
                  {windowRigelConstructionOptions.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={fieldLabelStyle}>
                <span>Макс. к-т использования</span>
                <input
                  aria-label="Макс. к-т использования"
                  style={fieldInputStyle}
                  value={String(input.maxUtilization).replace('.', ',')}
                  onChange={setNumericField('maxUtilization')}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <label style={fieldLabelStyle}>
                <span>Труба С245, руб/кг</span>
                <input
                  aria-label="Труба С245"
                  style={fieldInputStyle}
                  value={String(input.tubeS245PriceRubPerKg).replace('.', ',')}
                  onChange={setNumericField('tubeS245PriceRubPerKg')}
                />
              </label>

              <label style={fieldLabelStyle}>
                <span>Труба С345, руб/кг</span>
                <input
                  aria-label="Труба С345"
                  style={fieldInputStyle}
                  value={String(input.tubeS345PriceRubPerKg).replace('.', ',')}
                  onChange={setNumericField('tubeS345PriceRubPerKg')}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>Тип окна</span>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(5, minmax(72px, 1fr))' }}>
                {windowRigelWindowTypeOptions.map((windowType) => {
                  const isSelected = input.windowType === windowType
                  return (
                    <button
                      key={windowType}
                      type="button"
                      aria-label={`Тип окна ${windowType}`}
                      onClick={() => setInput((current) => ({ ...current, windowType }))}
                      style={{
                        display: 'grid',
                        gap: 6,
                        padding: 9,
                        borderRadius: 10,
                        border: isSelected
                          ? '1px solid #0f766e'
                          : '1px solid rgba(148, 163, 184, 0.26)',
                        background: isSelected ? 'rgba(240, 253, 250, 0.92)' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <TypeGlyph windowType={windowType} />
                      <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>Тип {windowType}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 8,
            padding: '16px 18px',
            borderRadius: 14,
            background: '#ffffff',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Нагрузки</h2>
          <div
            style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              color: '#334155',
              fontSize: 14,
            }}
          >
            <div>Ветер: {formatNumber(result.loads.windLoadKpa, 3)} кПа</div>
            <div>Вертикальная: {formatNumber(result.loads.verticalLoadKpa, 3)} кПа</div>
            <div>Горизонтальная I сл.: {formatNumber(result.loads.horizontalLoadCase1Kpa, 6)} кПа</div>
            <div>Горизонтальная II сл.: {formatNumber(result.loads.horizontalLoadCase2Kpa, 6)} кПа</div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <article
            style={{
              display: 'grid',
              gap: 16,
              padding: 20,
              borderRadius: 16,
              background: '#f8fafc',
              border: '1px solid rgba(15, 118, 110, 0.20)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22, color: '#0f172a' }}>Результат подбора</h2>
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              }}
            >
              <CandidateCard
                title="Лучший нижний ригель"
                candidate={result.bottomCandidates[0]}
                windowCount={windowCount}
                input={input}
              />
              <CandidateCard
                title="Лучший верхний ригель"
                candidate={result.workbookEffectiveTopCandidates[0]}
                windowCount={windowCount}
                input={input}
              />
            </div>
          </article>
        </section>

        <section style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <article
            style={{
              display: 'grid',
              gap: 16,
              padding: 18,
              borderRadius: 16,
              background: '#ffffff',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Нижний ригель</h2>
            {result.bottomCandidates.length > 0 ? (
              result.bottomCandidates.map((candidate, index) => (
                <RankedCandidate key={`${candidate.ordinal}-${candidate.steelGrade}`} rank={index + 1} candidate={candidate} />
              ))
            ) : (
              <div>Подходящих нижних ригелей не найдено.</div>
            )}
          </article>

          <article
            style={{
              display: 'grid',
              gap: 16,
              padding: 18,
              borderRadius: 16,
              background: '#ffffff',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Верхний ригель</h2>
            {result.workbookEffectiveTopCandidates.length > 0 ? (
              result.workbookEffectiveTopCandidates.map((candidate, index) => (
                <RankedCandidate key={`${candidate.ordinal}-${candidate.steelGrade}`} rank={index + 1} candidate={candidate} />
              ))
            ) : (
              <div>Подходящих верхних ригелей не найдено.</div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}
