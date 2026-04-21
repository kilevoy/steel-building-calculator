import { appMeta } from '@/shared/config/app-meta'

interface HomePageProps {
  onNavigate: (page: 'purlin' | 'column') => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="app-shell" data-testid="home-page">
      <div className="page">
        {/* Top bar */}
        <header className="topbar">
          <div className="brand-mark">
            <div className="brand-seal">MC</div>
            <div className="brand-copy">
              <p className="eyebrow">Engineering</p>
              <strong className="brand-title">{appMeta.name}</strong>
              <p className="brand-subtitle">Column and purlin calculators</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="chip">
              v<strong>{appMeta.version}</strong>
            </span>
            <span className="chip">
              <strong>Excel parity</strong>&nbsp;discipline
            </span>
          </div>
        </header>

        {/* Hero */}
        <div className="hero">
          <div className="hero-card">
            <div className="hero-grid" />
            <div className="hero-content">
              <h1 className="hero-title">Metal&shy;Calc</h1>
              <p className="hero-text">
                Fast engineering calculations with parity discipline.
                <br />
                Purlin and column selection backed by Excel-verified reference tables — no workbook
                runtime required.
              </p>
              <div className="hero-actions">
                <button
                  id="btn-open-purlin"
                  data-testid="open-purlin"
                  className="hero-button hero-button-primary"
                  onClick={() => onNavigate('purlin')}
                >
                  Прогоны
                </button>
                <button
                  id="btn-open-column"
                  data-testid="open-column"
                  className="hero-button hero-button-secondary"
                  onClick={() => onNavigate('column')}
                >
                  Колонны
                </button>
              </div>

              <div className="metric-strip">
                <div className="metric-card">
                  <span className="metric-label">Профилей ЛСТК</span>
                  <span className="metric-value">50+</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Городов</span>
                  <span className="metric-value">170+</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Обновление</span>
                  <span className="metric-value">2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dark aside */}
          <aside className="hero-card hero-aside">
            <div className="hero-grid" />
            <div className="hero-content">
              <h2 style={{ marginBottom: 16, fontSize: '1.05rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Small, fast, AI-friendly
              </h2>
              <div className="stack-list">
                <div className="stack-item">
                  <strong>React 19 + TypeScript 5</strong>
                  <span>Чистые функции без зависимости от Excel Runtime</span>
                </div>
                <div className="stack-item">
                  <strong>Zod 4 validation</strong>
                  <span>Ввод проверяется до расчёта, ошибки точно адресованы</span>
                </div>
                <div className="stack-item">
                  <strong>Vitest + Playwright</strong>
                  <span>Юнит-тесты на каждую ветку расчёта + e2e smoke</span>
                </div>
                <div className="stack-item">
                  <strong>Tauri-ready</strong>
                  <span>Веб-сборка сейчас — десктоп позже из того же ядра</span>
                </div>
              </div>
              <div className="roadmap-note">
                Расчёт прогонов и колонн перенесён из Excel 1:1.
                Следующие этапы: parity report и печатные отчёты.
              </div>
            </div>
          </aside>
        </div>

        {/* Calculators section */}
        <div className="section-grid">
          {/* Purlin card */}
          <div className="domain-card">
            <span className="domain-badge">Прогоны</span>
            <h3 className="domain-title">Подбор прогонов кровли и стен</h3>
            <div className="domain-meta">
              <div className="meta-tile">
                <strong>Профили</strong>
                <span>ЛСТК МП350 / МП390 / Сортовой</span>
              </div>
              <div className="meta-tile">
                <strong>Нагрузки</strong>
                <span>СП 20.13330 / СП РК EN</span>
              </div>
              <div className="meta-tile">
                <strong>Источник</strong>
                <span>calculator_final_release.xlsx</span>
              </div>
              <div className="meta-tile">
                <strong>Статус</strong>
                <span>✓ ТОП-10 работает</span>
              </div>
            </div>
            <button
              className="hero-button hero-button-primary"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => onNavigate('purlin')}
            >
              Открыть калькулятор →
            </button>
          </div>

          {/* Column card */}
          <div className="domain-card">
            <span className="domain-badge">Колонны</span>
            <h3 className="domain-title">Подбор сечений колонн</h3>
            <div className="domain-meta">
              <div className="meta-tile">
                <strong>Типы</strong>
                <span>Крайняя / Средняя / Фахверк</span>
              </div>
              <div className="meta-tile">
                <strong>Краны</strong>
                <span>Опорные и подвесные</span>
              </div>
              <div className="meta-tile">
                <strong>Источник</strong>
                <span>column_calculator_final_release.xlsx</span>
              </div>
              <div className="meta-tile">
                <strong>Статус</strong>
                <span>⬤ В работе</span>
              </div>
            </div>
            <button
              className="hero-button hero-button-secondary"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => onNavigate('column')}
            >
              Открыть калькулятор →
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div className="footer-note">
          Исходные рабочие тетради Excel остаются каноническими до прохождения parity-verification
          каждого модуля. Версия ядра:&nbsp;<strong>{appMeta.version}</strong> — расчёты
          воспроизводимы и покрыты юнит-тестами.
        </div>
      </div>
    </div>
  )
}
