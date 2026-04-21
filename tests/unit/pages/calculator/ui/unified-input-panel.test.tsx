import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { UnifiedInputPanel } from '@/pages/calculator/ui/unified-input-panel'
import {
  defaultUnifiedInput,
  type UnifiedInputState,
} from '@/pages/calculator/model/unified-input'

const CLEAR_HEIGHT_LABEL = '\u0412\u044B\u0441\u043E\u0442\u0430 \u0434\u043E \u043D\u0438\u0437\u0430 \u043D\u0435\u0441\u0443\u0449\u0438\u0445, \u043C'
const TRUSS_EAVE_DEPTH_LABEL = '\u0412\u044B\u0441\u043E\u0442\u0430 \u0444\u0435\u0440\u043C\u044B \u0432 \u043A\u0430\u0440\u043D\u0438\u0437\u0435, \u043C'
const USE_MANUAL_LABEL = '\u0417\u0430\u0434\u0430\u0442\u044C \u0432\u0440\u0443\u0447\u043D\u0443\u044E'

function TestHarness() {
  const [input, setInput] = useState<UnifiedInputState>(defaultUnifiedInput)

  return (
    <UnifiedInputPanel
      input={input}
      onChange={(key, value) => setInput((prev) => ({ ...prev, [key]: value }))}
    />
  )
}

describe('UnifiedInputPanel', () => {
  it('shows readable Russian labels for the height fields', () => {
    render(<TestHarness />)

    expect(screen.getByText(CLEAR_HEIGHT_LABEL)).toBeInTheDocument()
    expect(screen.getByText(TRUSS_EAVE_DEPTH_LABEL)).toBeInTheDocument()
    expect(screen.getByText(USE_MANUAL_LABEL)).toBeInTheDocument()
  })

  it('disables truss eave input until manual mode is enabled', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    const input = screen.getByRole('textbox', { name: TRUSS_EAVE_DEPTH_LABEL })
    expect(input).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: USE_MANUAL_LABEL }))
    expect(input).toBeEnabled()
  })

  it('keeps manual truss eave depth when entered with a comma', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    await user.click(screen.getByRole('checkbox', { name: USE_MANUAL_LABEL }))

    const input = screen.getByRole('textbox', { name: TRUSS_EAVE_DEPTH_LABEL })

    await user.clear(input)
    await user.type(input, '1,08')

    expect(input).toHaveValue('1,08')
  })
})
