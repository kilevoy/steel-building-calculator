import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalculatorPage } from '@/pages/calculator/ui/calculator-page'

describe('CalculatorPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('does not render the graphics tab', () => {
    render(<CalculatorPage initialDomain="column" />)

    expect(screen.queryByTestId('tab-graphics')).not.toBeInTheDocument()
  })

  it('keeps the truss and purlin pages textual', async () => {
    const user = userEvent.setup()
    const { container } = render(<CalculatorPage initialDomain="column" />)

    await user.click(screen.getByTestId('tab-truss'))
    expect(screen.getByTestId('truss-panel')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="truss-panel"] .truss-visual')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('tab-purlin'))
    expect(container.querySelector('.purlin-truss-visual')).not.toBeInTheDocument()
  })
})
