import insiLogoUrl from '@/assets/insi-logo.png'

interface CraneBeamMethodologyPageProps {
  backHref: string
  demoHref: string
}

export function CraneBeamMethodologyPage({
  backHref,
  demoHref,
}: CraneBeamMethodologyPageProps) {
  return (
    <div className="app-shell">
      <main
        data-testid="crane-beam-methodology-page"
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
            <div style={{ display: 'grid', gap: 8, maxWidth: 860 }}>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, color: '#0f172a' }}>
                Методика расчета подкрановой балки
              </h1>
              <div style={{ color: '#475569', lineHeight: 1.5 }}>
                Страница собрана по текстам и логике старой published-версии и описывает, какие
                исходные параметры участвуют в предварительном подборе прокатной подкрановой балки.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={demoHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 10,
                background: '#e2f3ef',
                color: '#0f766e',
                border: '1px solid rgba(15, 118, 110, 0.22)',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Открыть demo
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

        {[
          {
            title: 'Назначение расчета',
            body: 'Модуль нужен для предварительного подбора прокатной подкрановой балки по параметрам крана, рельса и расчетной схемы. На выходе инженер получает рекомендуемый профиль, расчетные усилия, массу и коэффициент использования.',
          },
          {
            title: 'Исходные данные',
            body: 'В расчет вводятся грузоподъемность и пролет крана, тип подвеса груза, группа режима работы, число кранов в пролете, тип рельса, пролет балки, наличие тормозной конструкции и шаг ребер жесткости. Паспортные параметры могут подставляться автоматически или задаваться вручную.',
          },
          {
            title: 'Расчетные воздействия',
            body: 'По исходным данным формируются вертикальные и поперечные воздействия от крановой нагрузки, а также производные коэффициенты Tbн, Qbн, gamma local, nvyn, alpha и расчетный случай для схемы с двумя кранами. На их основе считаются Mx, My, Q и Qдоп.',
          },
          {
            title: 'Подбор профиля',
            body: 'В восстановленной версии основной выбор профиля идет по workbook-каталогу старого калькулятора. Это сохраняет близость к опубликованной логике там, где reference-данные уже были подтверждены.',
          },
          {
            title: 'Критерии проверки',
            body: 'Итоговый показатель для пользователя — коэффициент использования и набор расчетных усилий. Такой формат помогает быстро сравнивать варианты по несущей способности, массе и чувствительности к входным параметрам.',
          },
        ].map((section) => (
          <section
            key={section.title}
            style={{
              display: 'grid',
              gap: 8,
              padding: 18,
              borderRadius: 16,
              background: '#ffffff',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>{section.title}</h2>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{section.body}</p>
          </section>
        ))}
      </main>
    </div>
  )
}
