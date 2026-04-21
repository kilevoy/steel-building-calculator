import { CalculatorPage } from '@/pages/calculator/ui/calculator-page'
import { CraneBeamDemoPage } from '@/pages/crane-beam/ui/crane-beam-demo-page'
import { CraneBeamMethodologyPage } from '@/pages/crane-beam/ui/crane-beam-methodology-page'
import { WindowRigelDemoPage } from '@/pages/window-rigel/ui/window-rigel-demo-page'

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

export function App() {
  const route = getRequestedRoute()
  const baseHref = getBaseCalculatorHref(route)

  if (route === '/crane-beam-methodology' || route.endsWith('/crane-beam-methodology')) {
    return <CraneBeamMethodologyPage backHref={baseHref} demoHref={`${baseHref}?route=crane-beam-demo`} />
  }

  if (route === '/crane-beam-demo' || route.endsWith('/crane-beam-demo')) {
    return (
      <CraneBeamDemoPage
        backHref={baseHref}
        methodologyHref={`${baseHref}?route=crane-beam-methodology`}
      />
    )
  }

  if (route === '/window-rigel-demo' || route.endsWith('/window-rigel-demo')) {
    return <WindowRigelDemoPage backHref={baseHref} />
  }

  return <CalculatorPage initialDomain="column" />
}
