import { Suspense, lazy } from 'react'

import { CalculatorPage } from '@/pages/calculator/ui/calculator-page'

const CraneBeamDemoPage = lazy(() =>
  import('@/pages/crane-beam/ui/crane-beam-demo-page').then((module) => ({
    default: module.CraneBeamDemoPage,
  })),
)
const CraneBeamMethodologyPage = lazy(() =>
  import('@/pages/crane-beam/ui/crane-beam-methodology-page').then((module) => ({
    default: module.CraneBeamMethodologyPage,
  })),
)
const WindowRigelDemoPage = lazy(() =>
  import('@/pages/window-rigel/ui/window-rigel-demo-page').then((module) => ({
    default: module.WindowRigelDemoPage,
  })),
)

export type DomainTab =
  | 'purlin'
  | 'column'
  | 'truss'
  | 'summary'
  | 'selection-summary'
  | 'enclosing'
  | 'methodology'

function getRequestedRoute() {
  if (typeof window === 'undefined') {
    return '/'
  }

  const queryRoute = new URLSearchParams(window.location.search).get('route')?.trim()
  if (queryRoute) {
    return queryRoute.startsWith('/') ? queryRoute : `/${queryRoute}`
  }

  const hash = window.location.hash.trim()
  if (hash.startsWith('#/')) {
    return hash.slice(1)
  }

  return window.location.pathname
}

function getBaseCalculatorHref(pathname: string) {
  return pathname.startsWith('/steel-building-calculator/') ? '/steel-building-calculator/' : '/'
}

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__spinner" aria-hidden="true" />
      Загрузка модуля…
    </div>
  )
}

export function App() {
  const route = getRequestedRoute()
  const baseHref = getBaseCalculatorHref(route)

  if (route === '/crane-beam-methodology' || route.endsWith('/crane-beam-methodology')) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <CraneBeamMethodologyPage backHref={baseHref} demoHref={`${baseHref}?route=crane-beam-demo`} />
      </Suspense>
    )
  }

  if (route === '/crane-beam-demo' || route.endsWith('/crane-beam-demo')) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <CraneBeamDemoPage
          backHref={baseHref}
          methodologyHref={`${baseHref}?route=crane-beam-methodology`}
        />
      </Suspense>
    )
  }

  if (route === '/window-rigel-demo' || route.endsWith('/window-rigel-demo')) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <WindowRigelDemoPage backHref={baseHref} />
      </Suspense>
    )
  }

  return <CalculatorPage initialDomain="column" />
}
