import { expect, test } from '@playwright/test'

test('renders the calculator shell by default', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('calculator-page')).toBeVisible()
  await expect(page.getByTestId('tab-column')).toBeVisible()
  await expect(page.getByTestId('tab-truss')).toBeVisible()
  await expect(page.getByTestId('tab-purlin')).toBeVisible()
  await expect(page.getByTestId('tab-enclosing')).toBeVisible()
  await expect(page.getByTestId('tab-summary')).toBeVisible()
  await expect(page.getByTestId('tab-graphics')).toHaveCount(0)
  await expect(page.getByTestId('tab-column')).toHaveClass(/active/)
  await expect(page.locator('.split-left')).toBeVisible()
})

test('switches between summary, enclosing, truss, methodology, column and purlin result tabs', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('tab-summary').click()
  await expect(page.getByTestId('tab-summary')).toHaveClass(/active/)
  await expect(page.locator('.results-section--summary-sheet')).toBeVisible()

  await page.getByTestId('tab-enclosing').click()
  await expect(page.getByTestId('tab-enclosing')).toHaveClass(/active/)
  await expect(page.getByTestId('enclosing-panel')).toBeVisible()

  await page.getByTestId('tab-truss').click()
  await expect(page.getByTestId('tab-truss')).toHaveClass(/active/)
  await expect(page.getByTestId('truss-panel')).toBeVisible()
  await expect(page.locator('[data-testid="truss-panel"] .truss-visual')).toHaveCount(0)
  await expect(page.locator('[data-testid="truss-panel"] table.data-table').first()).toBeVisible()

  await page.getByTestId('tab-methodology').click()
  await expect(page.getByTestId('tab-methodology')).toHaveClass(/active/)
  await expect(page.getByText('Excel parity')).toBeVisible()

  await page.getByTestId('tab-purlin').click({ force: true })
  await expect(page.getByTestId('tab-purlin')).toHaveClass(/active/)
  await expect(page.locator('.load-grid--purlin')).toBeVisible()
  await expect(page.locator('.purlin-truss-visual')).toHaveCount(0)

  await page.getByTestId('tab-column').click()
  await expect(page.getByTestId('tab-column')).toHaveClass(/active/)
  await expect(page.locator('.results-section-row')).toBeVisible()
})

test('shows three snow bag modes in unified input', async ({ page }) => {
  await page.goto('/')

  const snowBagSelect = page.getByLabel('Снеговой мешок')
  await expect(snowBagSelect).toBeVisible()
  await snowBagSelect.selectOption({ index: 2 })
  await expect(page.locator('.field-row.animate-in')).toBeVisible()
})

test('switches between light and dark themes', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('theme-dark').click()
  await expect(page.getByTestId('calculator-page')).toHaveAttribute('data-theme', 'dark')

  await page.getByTestId('theme-light').click()
  await expect(page.getByTestId('calculator-page')).toHaveAttribute('data-theme', 'light')
})
