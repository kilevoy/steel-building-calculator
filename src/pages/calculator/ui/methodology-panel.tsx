import { useRef } from 'react'
import type { ColumnCalculationResult } from '@/domain/column/model/calculate-column'
import type { PurlinCalculationResult } from '@/domain/purlin/model/calculate-purlin'
import type { UnifiedInputState } from '../model/unified-input'

interface MethodologyPanelProps {
  input: UnifiedInputState
  purlinResult: PurlinCalculationResult | null
  columnResult: ColumnCalculationResult | null
}

function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })
}

function resolveRoofHeightFormula(roofType: string): string {
  return roofType === 'двускатная'
    ? 'H(x) = Hbase + min(x, Span - x) * tan(angle)'
    : 'H(x) = Hbase + x * tan(angle)'
}

function resolveCurrentGeometry(input: UnifiedInputState): string {
  return `${formatNumber(input.spanM, 2)} x ${formatNumber(input.buildingLengthM, 2)} x ${formatNumber(input.clearHeightToBottomChordM, 2)} м`
}

function resolveMassDrivers(input: UnifiedInputState): string[] {
  return [
    `Пролет ${formatNumber(input.spanM, 2)} м: чем больше пролет, тем выше моменты и требования к сечению.`,
    `Шаг рам ${formatNumber(input.frameStepM, 2)} м и шаг фахверка ${formatNumber(input.fakhverkStepM, 2)} м: влияют на число элементов и длину расчетных веток.`,
    `Город ${input.city} и тип местности ${input.terrainType}: определяют снеговой и ветровой фон.`,
    `Кровля ${input.roofType} с уклоном ${formatNumber(input.roofSlopeDeg, 1)}°: влияет на высоту колонн и распределение нагрузок.`,
    `Снеговой мешок ${input.snowBagMode}: может резко увеличить расчетную нагрузку на отдельные прогоны.`,
    `Источник прогонов ${input.purlinSpecificationSource === 'sort' ? 'Сортовой' : 'ЛСТК'}: меняет саму модель массы и принцип ранжирования.`,
  ]
}

export function MethodologyPanel({ input, purlinResult, columnResult }: MethodologyPanelProps) {
  const methodologyRef = useRef<HTMLDivElement | null>(null)
  const roofFormula = resolveRoofHeightFormula(input.roofType)
  const currentGeometry = resolveCurrentGeometry(input)
  const massDrivers = resolveMassDrivers(input)

  const handleStandalonePrint = () => {
    if (!methodologyRef.current) {
      return
    }

    const clone = methodologyRef.current.cloneNode(true) as HTMLDivElement
    clone.querySelectorAll('[data-print-hide="true"]').forEach((node) => node.remove())

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1280,height=900')
    if (!printWindow) {
      window.print()
      return
    }

    const html = `
      <!doctype html>
      <html lang="ru">
        <head>
          <meta charset="utf-8" />
          <title>Пояснительная записка</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #1f2a34;
              background: #ffffff;
            }
            .sheet {
              max-width: 1120px;
              margin: 0 auto;
            }
            .sheet * {
              box-sizing: border-box;
            }
            .methodology-print-note {
              display: flex !important;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 1px solid #d8dde2;
            }
            .methodology-print-note div {
              display: grid;
              gap: 4px;
            }
            .methodology-print-note strong {
              font-size: 16px;
            }
            .methodology-print-note span,
            .results-inline-note,
            .methodology-check-card p,
            .methodology-formula-card p,
            .methodology-term-card span,
            .methodology-mini-tile span,
            .load-tile span {
              color: #5d6874;
            }
            .results-section-title {
              margin: 0 0 12px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #42515e;
            }
            .summary-hero,
            .methodology-section-grid,
            .methodology-mini-grid,
            .methodology-columns,
            .methodology-formula-grid,
            .methodology-checks,
            .methodology-terms-grid,
            .load-grid {
              display: grid;
              gap: 10px;
            }
            .summary-hero,
            .methodology-checks,
            .methodology-formula-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .methodology-section-grid,
            .methodology-columns,
            .load-grid,
            .methodology-mini-grid,
            .methodology-terms-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .summary-metric-card,
            .methodology-card,
            .methodology-mini-tile,
            .methodology-column,
            .methodology-formula-card,
            .methodology-check-card,
            .methodology-term-card,
            .load-tile {
              border: 1px solid #d8dde2;
              border-radius: 8px;
              background: #ffffff;
              padding: 12px;
            }
            .summary-metric-card--accent {
              background: #1b78c2;
              border-color: #1b78c2;
              color: #ffffff;
            }
            .summary-metric-card span,
            .methodology-mini-tile span,
            .methodology-check-card span,
            .load-tile span,
            .methodology-formula-card span {
              display: block;
              margin-bottom: 6px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #6a7480;
            }
            .summary-metric-card--accent span,
            .summary-metric-card--accent strong {
              color: #ffffff;
            }
            .summary-metric-card strong,
            .load-tile strong {
              font-size: 18px;
            }
            .methodology-card h4,
            .methodology-card h5 {
              margin: 0 0 10px;
            }
            .methodology-list,
            .methodology-steps {
              margin: 0;
              padding-left: 18px;
              line-height: 1.55;
            }
            .methodology-formula {
              margin-top: 12px;
              padding: 10px 12px;
              border-left: 3px solid #be6d3a;
              background: #f8fafc;
              border-radius: 6px;
            }
            .methodology-formula-card code {
              display: block;
              padding: 8px 10px;
              border-radius: 6px;
              background: #f5f7fa;
              overflow-x: auto;
            }
            .methodology-term-card strong { color: #8d4b22; }
            .methodology-term-card span,
            .methodology-check-card p,
            .methodology-formula-card p {
              font-size: 13px;
              line-height: 1.5;
            }
            @media print {
              body { padding: 0; }
              .sheet { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="sheet">${clone.innerHTML}</div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="tab-pane animate-in">
      <section className="results-section results-section--summary-sheet methodology-sheet" ref={methodologyRef}>
        <div className="methodology-print-note">
          <div>
            <strong>Пояснительная записка</strong>
            <span>Методика предварительного подбора колонн и прогонов</span>
          </div>
          <div>
            <span>Город: {input.city}</span>
            <span>Геометрия: {currentGeometry}</span>
          </div>
        </div>

        <div className="methodology-header">
          <div>
            <h3 className="results-section-title">Методика подбора</h3>
            <p className="results-inline-note methodology-lead">
              Здесь собрана логика предварительного расчета: какие исходные параметры участвуют
              в подборе, по каким нагрузкам и критериям отсеиваются кандидаты, какие формулы
              и reference-таблицы используются и что именно попадает в итоговую спецификацию.
            </p>
          </div>

          <div className="methodology-actions" data-print-hide="true">
            <div className="methodology-badges">
              <span className="methodology-badge">Excel parity</span>
              <span className="methodology-badge">Pure domain kernels</span>
              <span className="methodology-badge">СП 20 / workbook tables</span>
            </div>
            <div className="methodology-actions-row">
              <button className="results-print-action" onClick={() => window.print()}>
                Печать / PDF
              </button>
              <button className="results-print-action results-print-action--accent" onClick={handleStandalonePrint}>
                Экспорт пояснительной
              </button>
            </div>
          </div>
        </div>

        <div className="summary-hero summary-hero--methodology">
          <div className="summary-metric-card summary-metric-card--accent">
            <span>Исходный кейс</span>
            <strong>{`${input.city} / ур. отв ${input.responsibilityLevel}`}</strong>
          </div>
          <div className="summary-metric-card">
            <span>Геометрия</span>
            <strong>{currentGeometry}</strong>
          </div>
          <div className="summary-metric-card">
            <span>Подбор прогонов</span>
            <strong>{`${input.purlinSpecificationSource === 'sort' ? 'Сортовой' : 'ЛСТК'} / ${input.purlinSelectionMode === 'manual' ? 'ручной' : 'авто'}`}</strong>
          </div>
          <div className="summary-metric-card">
            <span>Подбор колонн</span>
            <strong>{`${input.columnSelectionMode === 'engineering' ? 'Инженерный Hmax' : 'Excel-режим'} / ${input.isManualMode ? 'ручной' : 'авто'}`}</strong>
          </div>
        </div>

        <div className="methodology-section-grid">
          <section className="methodology-card">
            <h4>Нормативная база и принцип моделирования</h4>
            <ul className="methodology-list">
              <li>
                Нормативные снеговые и ветровые районы, коэффициенты по высоте, аэродинамические
                поправки и каталоги профилей берутся из reference-таблиц, перенесенных из
                исходных Excel-калькуляторов.
              </li>
              <li>
                Основная ветка нагрузок ориентирована на <strong>СП 20.13330</strong>; это же
                отражено в workbook-логике, с которой поддерживается parity.
              </li>
              <li>
                Для части веток прогонов сохранена совместимость с workbook-сценарием
                <strong> по СП РК EN</strong>, если такой флаг присутствует в данных города.
              </li>
              <li>
                Формулы расчета находятся только в domain-слое, а интерфейс показывает уже
                готовый расчетный контекст, коэффициенты использования и спецификацию.
              </li>
            </ul>
          </section>

          <section className="methodology-card">
            <h4>Какие параметры участвуют в подборе</h4>
            <div className="methodology-mini-grid">
              <div className="methodology-mini-tile">
                <span>Геометрия</span>
                <strong>Пролет, длина, высота, уклон, шаг рам, шаг фахверка, многопролетность</strong>
              </div>
              <div className="methodology-mini-tile">
                <span>Климат</span>
                <strong>Город, тип местности, уровень ответственности</strong>
              </div>
              <div className="methodology-mini-tile">
                <span>Ограждающие</span>
                <strong>Тип кровли, покрытие, профлист, стеновое покрытие</strong>
              </div>
              <div className="methodology-mini-tile">
                <span>Особые условия</span>
                <strong>Снеговой мешок, перепад высот, тяжи, снегозадержание, ограждение</strong>
              </div>
              <div className="methodology-mini-tile">
                <span>Колонны</span>
                <strong>Тип колонны, связи, крановые нагрузки, режим Hmax</strong>
              </div>
              <div className="methodology-mini-tile">
                <span>Экономика</span>
                <strong>Цены по категориям профиля и маркам стали</strong>
              </div>
            </div>
          </section>
        </div>

        <div className="methodology-section-grid">
          <section className="methodology-card">
            <h4>Термины и обозначения</h4>
            <div className="methodology-terms-grid">
              <div className="methodology-term-card">
                <strong>N</strong>
                <span>Осевая сила в колонне, кН.</span>
              </div>
              <div className="methodology-term-card">
                <strong>M</strong>
                <span>Изгибающий момент, кН·м.</span>
              </div>
              <div className="methodology-term-card">
                <strong>Hactual</strong>
                <span>Фактическая рабочая длина/высота элемента в группе.</span>
              </div>
              <div className="methodology-term-card">
                <strong>Hmax</strong>
                <span>Максимальная высота в группе, по которой выбирается профиль в инженерном режиме.</span>
              </div>
              <div className="methodology-term-card">
                <strong>q</strong>
                <span>Линейная нагрузка на прогон, зависящая от шага и площади нагрузки.</span>
              </div>
              <div className="methodology-term-card">
                <strong>Utilization</strong>
                <span>Коэффициент использования; допустимое значение для прошедшего кандидата ≤ 1.0.</span>
              </div>
            </div>
          </section>

          <section className="methodology-card methodology-card--accent-soft">
            <h4>Что влияет на массу сильнее всего</h4>
            <ul className="methodology-list methodology-list--compact">
              {massDrivers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="methodology-card">
          <h4>Какие нагрузки формируются в расчете</h4>
          <div className="methodology-columns">
            <div className="methodology-column">
              <h5>Для прогонов</h5>
              <ul className="methodology-list">
                <li>Снеговая нагрузка по району и коэффициентам ответственности.</li>
                <li>Ветровая нагрузка по району, типу местности и высоте здания.</li>
                <li>Постоянная нагрузка от покрытия.</li>
                <li>Эксплуатационная нагрузка.</li>
                <li>Дополнительная нагрузка от снегового мешка, если он включен.</li>
                <li>Фасадная ветровая составляющая для ряда проверок сортового прогона.</li>
              </ul>
            </div>

            <div className="methodology-column">
              <h5>Для колонн</h5>
              <ul className="methodology-list">
                <li>Снеговая и ветровая нагрузка по городу.</li>
                <li>Нагрузки от кровельного и стенового ограждения.</li>
                <li>Высотные и аэродинамические коэффициенты.</li>
                <li>Осевая сила N и изгибающий момент M как итог расчетного контекста.</li>
                <li>Дополнительные крановые воздействия, если они включены.</li>
                <li>Влияние схемы связей и расчетных длин по рабочим осям.</li>
              </ul>
            </div>
          </div>

          <div className="load-grid load-grid--summary methodology-load-grid">
            <div className="load-tile">
              <span>Снег район прогонов</span>
              <strong>{purlinResult ? `${formatNumber(purlinResult.loadSummary.snowRegionKpa, 2)} кПа` : '-'}</strong>
            </div>
            <div className="load-tile">
              <span>Ветер район прогонов</span>
              <strong>{purlinResult ? `${formatNumber(purlinResult.loadSummary.windRegionKpa, 2)} кПа` : '-'}</strong>
            </div>
            <div className="load-tile">
              <span>Суммарная расчетная нагрузка</span>
              <strong>{purlinResult ? `${formatNumber(purlinResult.loadSummary.designTotalKpa, 2)} кПа` : '-'}</strong>
            </div>
            <div className="load-tile">
              <span>Осевая сила колонны</span>
              <strong>{columnResult?.derivedContext ? `${formatNumber(columnResult.derivedContext.axialLoadKn, 1)} кН` : '-'}</strong>
            </div>
            <div className="load-tile">
              <span>Момент колонны</span>
              <strong>{columnResult?.derivedContext ? `${formatNumber(columnResult.derivedContext.bendingMomentKnM, 1)} кН·м` : '-'}</strong>
            </div>
            <div className="load-tile">
              <span>Коэф. снегового мешка</span>
              <strong>{purlinResult ? formatNumber(purlinResult.loadSummary.snowBagFactor, 2) : '-'}</strong>
            </div>
          </div>
        </section>

        <section className="methodology-card">
          <h4>Ключевые формулы и правила отбора</h4>
          <div className="methodology-formula-grid">
            <div className="methodology-formula-card">
              <span>Высота колонны</span>
              <code>{roofFormula}</code>
              <p>Формула зависит от типа кровли и определяет фактическую рабочую высоту в группе.</p>
            </div>
            <div className="methodology-formula-card">
              <span>Количество основных колонн</span>
              <code>Nmain = ((Length / FrameStep) - 1) * 2</code>
              <p>Для крайних рам используется обе стороны здания.</p>
            </div>
            <div className="methodology-formula-card">
              <span>Количество фахверковых колонн</span>
              <code>Nfach = ((Span / FachwerkStep) + 1) * 2</code>
              <p>Используется отдельная группа торцевых и фахверковых стоек.</p>
            </div>
            <div className="methodology-formula-card">
              <span>Подбор колонны по группе</span>
              <code>Hmax = max(Hactual_i)</code>
              <p>В инженерном режиме профиль подбирается по худшему элементу группы.</p>
            </div>
            <div className="methodology-formula-card">
              <span>Линия нагрузок на прогон</span>
              <code>q = qdesign * step</code>
              <p>Шаг прогона напрямую влияет на линейную нагрузку и коэффициент использования.</p>
            </div>
            <div className="methodology-formula-card">
              <span>Отсев кандидата</span>
              <code>utilization ≤ 1.0</code>
              <p>В таблицы попадают только профили, прошедшие расчетные проверки.</p>
            </div>
          </div>
        </section>

        <div className="methodology-section-grid">
          <section className="methodology-card">
            <h4>Как подбираются колонны</h4>
            <ol className="methodology-steps">
              <li>Колонны разбиваются на группы: крайние, фахверковые и средние.</li>
              <li>Для группы собирается геометрия и расчетный контекст по N и M.</li>
              <li>Кандидаты проверяются по прочности, устойчивости X/Y и гибкости X/Y.</li>
              <li>Топ-лист сортируется по workbook-совместимой целевой функции массы и цены.</li>
              <li>В ручном режиме инженер может выбрать другой индекс профиля в группе.</li>
              <li>Спецификация считается по реальным длинам всех колонн, а не только по критической.</li>
            </ol>

            <div className="methodology-formula">
              <strong>Практический смысл:</strong> один профиль назначается на всю группу,
              чтобы спецификация оставалась технологичной и повторяемой на реальном объекте.
            </div>
          </section>

          <section className="methodology-card">
            <h4>Как подбираются прогоны</h4>
            <ol className="methodology-steps">
              <li>Сначала строится цепочка нагрузок: снег, ветер, покрытие, эксплуатация, снеговой мешок.</li>
              <li>Дальше параллельно проверяются ветки сортового проката и ЛСТК.</li>
              <li>Сортовой прогон проверяется по прочности, устойчивости, гибкости и прогибу.</li>
              <li>ЛСТК проверяется по несущей способности, допустимому шагу и фильтрам панели.</li>
              <li>В авто-режиме в спецификацию попадает лучший кандидат выбранного источника.</li>
              <li>В ручном режиме инженер выбирает конкретный профиль из сформированного списка.</li>
            </ol>

            <div className="methodology-formula">
              <strong>Практический смысл:</strong> у ЛСТК и сортового прогона разные модели массы,
              поэтому сравнивать их нужно уже по итоговой массе и спецификационному сценарию.
            </div>
          </section>
        </div>

        <section className="methodology-card">
          <h4>Какие проверки видит инженер</h4>
          <div className="methodology-checks">
            <div className="methodology-check-card">
              <span>Колонны</span>
              <strong>Прочность</strong>
              <p>Контроль суммарных напряжений от осевой силы и момента.</p>
            </div>
            <div className="methodology-check-card">
              <span>Колонны</span>
              <strong>Устойчивость X/Y</strong>
              <p>Проверка по расчетным длинам, радиусам инерции и схеме связей.</p>
            </div>
            <div className="methodology-check-card">
              <span>Колонны</span>
              <strong>Гибкость X/Y</strong>
              <p>Ограничение по стройности для обеих осей.</p>
            </div>
            <div className="methodology-check-card">
              <span>Прогоны сортовые</span>
              <strong>Прочность, устойчивость, прогиб</strong>
              <p>Проверка по вертикальной и фасадной составляющей нагрузки.</p>
            </div>
            <div className="methodology-check-card">
              <span>Прогоны ЛСТК</span>
              <strong>Несущая способность</strong>
              <p>Контроль по расчетному моменту и ограничению коэффициента использования.</p>
            </div>
            <div className="methodology-check-card">
              <span>Экономика</span>
              <strong>Масса и стоимость</strong>
              <p>Считаются отдельно от расчетной прочности и используются в ранжировании.</p>
            </div>
          </div>
        </section>

        <section className="methodology-card">
          <h4>Что попадает в выдачу</h4>
          <ul className="methodology-list">
            <li>
              Для колонн: группа, координата, длина, профиль, сталь, число ветвей, распорки,
              масса и ориентировочная стоимость.
            </li>
            <li>
              Для прогонов: семейство, профиль, шаг, масса на погонный метр, масса на шаг,
              масса на здание, масса с распорками и ориентировочная стоимость.
            </li>
            <li>
              Во вкладке <strong>Сводная</strong> выводятся общая масса и укрупненная стоимость
              по выбранным колоннам и прогонам.
            </li>
          </ul>
        </section>

        <section className="methodology-card methodology-card--warning">
          <h4>Ограничения модели</h4>
          <ul className="methodology-list">
            <li>
              Калькулятор предназначен для предварительного подбора и не заменяет полный комплект
              КМ/КМД и финальную инженерную проверку.
            </li>
            <li>
              Расчет ограничен диапазонами интерполяции по высоте, пролету и шагам, зашитыми в
              reference-таблицы и workbook-источники.
            </li>
            <li>
              Если допустимый кандидат не найден, приложение не формирует фиктивную спецификацию,
              а показывает отсутствие решения.
            </li>
            <li>
              Источником истины для справочных таблиц остаются workbook-файлы, а parity с Excel
              проверяется отдельными smoke- и parity-тестами.
            </li>
          </ul>
        </section>
      </section>
    </div>
  )
}
