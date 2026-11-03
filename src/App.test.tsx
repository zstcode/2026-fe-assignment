import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './test/setup'
import { formatMoney } from './lib/format'
import App from './App'

beforeAll(() => {
  // jsdom does not implement the native dialog methods.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
beforeEach(() => {
  document.documentElement.dataset.theme = 'light'
  document.documentElement.dataset.segment = 'retail'
})
afterEach(() => {
  cleanup()
  localStorage.clear()
})

const moneyText = (amount: number) => formatMoney(amount).replaceAll('\u00a0', ' ')

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

async function startTransfer(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: 'Good evening, Ava' })
  await user.click(screen.getByRole('button', { name: 'New transfer' }))
  await user.click(await screen.findByRole('radio', { name: /Jamie Tan/ }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

describe('Dashboard tests', () => {
  it('loads the dashboard with deposit total, all accounts and the eight newest transactions', async () => {
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Good evening, Ava' })).toBeVisible()
    const total = within(screen.getByRole('region', { name: 'Total available' }))
    expect(total.getByText(moneyText(17120.55))).toBeVisible()
    expect(total.getByText('Across 2 deposit accounts')).toBeVisible()
    expect(total.getByRole('button', { name: 'New transfer' })).toBeEnabled()

    const accounts = [
      { name: 'Everyday Checking', number: '•••• 4821', balance: 4280.55 },
      { name: 'Savings Plus', number: '•••• 9930', balance: 12840 },
      { name: 'Rewards Card', number: '•••• 7712', balance: -420.3 },
    ]
    for (const account of accounts) {
      const card = within(screen.getByRole('button', { name: `Filter transactions by ${account.name}` }))
      expect(card.getByText(account.name)).toBeVisible()
      expect(card.getByText(account.number)).toBeVisible()
      expect(card.getByText(moneyText(account.balance))).toBeVisible()
    }
    expect(screen.getByText('Amount due')).toBeVisible()

    const transactions = within(screen.getByRole('region', { name: 'Recent transactions' }))
    const rows = await transactions.findAllByRole('listitem')
    expect(rows).toHaveLength(8)
    expect(rows.map((row) => within(row).getByRole('heading').textContent)).toEqual([
      'FairPrice Finest',
      'Grab',
      'Kopitiam Corner',
      'Spotify',
      'PayNow from Marcus Lee',
      'Salary — Northwind Labs',
      'SP Group',
      'Uniqlo',
    ])
    expect(within(rows[0]).getByText('groceries')).toBeVisible()
    expect(within(rows[0]).getByText('19 Oct')).toBeVisible()
    expect(within(rows[0]).getByText(`-${moneyText(86.4)}`)).toBeVisible()
    expect(within(rows[1]).getByText('Pending')).toBeVisible()
    expect(within(rows[4]).getByText(`+${moneyText(45)}`)).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading dashboard' })).not.toBeInTheDocument()
  })

  it('shows dashboard skeletons while loading and replaces them with usable content', async () => {
    let finishLoading = () => {}
    const loading = new Promise<void>((resolve) => {
      finishLoading = resolve
    })
    server.use(
      http.get('*/api/accounts', async () => {
        await loading
      }, { once: true }),
    )
    renderApp()

    try {
      const dashboard = screen.getByRole('status', { name: 'Loading dashboard' })
      expect(dashboard).toHaveAttribute('aria-busy', 'true')
      for (const button of within(dashboard).getAllByRole('button', { hidden: true })) {
        expect(button).toBeDisabled()
      }
      expect(within(dashboard).getByRole('searchbox', { hidden: true })).toBeDisabled()
      expect(screen.queryByText('No accounts to display.')).not.toBeInTheDocument()
      expect(screen.queryByText('No recent transactions.')).not.toBeInTheDocument()
    } finally {
      finishLoading()
    }

    await screen.findByRole('heading', { name: 'Good evening, Ava' })
    expect(screen.queryByRole('status', { name: 'Loading dashboard' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New transfer' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Filter transactions by Savings Plus' })).toBeEnabled()
    expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toBeEnabled()
    expect(await screen.findByText('Spotify')).toBeVisible()
  })

  it('shows a failed dashboard request and loads it on Retry', async () => {
    server.use(
      http.get(
        '*/api/accounts',
        () => HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Down' } }, { status: 500 }),
        { once: true },
      ),
    )
    const user = renderApp()
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load your dashboard.")
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Good evening, Ava' })).toBeVisible()
    expect(screen.getByText(moneyText(17120.55))).toBeVisible()
    expect(await screen.findByText('Spotify')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('switches all four theme and segment combinations and saves preferences', async () => {
    const user = renderApp()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(document.documentElement).toHaveAttribute('data-segment', 'retail')
    await user.click(screen.getByRole('button', { name: 'Premium' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(document.documentElement).toHaveAttribute('data-segment', 'premium')
    expect(localStorage.getItem('meridian-segment')).toBe('premium')
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement).toHaveAttribute('data-segment', 'premium')
    expect(localStorage.getItem('meridian-theme')).toBe('dark')

    cleanup()
    const restoredUser = renderApp()
    expect(screen.getByRole('button', { name: 'Premium' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toHaveAttribute('aria-pressed', 'true')
    await restoredUser.click(screen.getByRole('button', { name: 'Retail' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement).toHaveAttribute('data-segment', 'retail')
    expect(localStorage.getItem('meridian-segment')).toBe('retail')
    await restoredUser.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(document.documentElement).toHaveAttribute('data-segment', 'retail')
    expect(localStorage.getItem('meridian-theme')).toBe('light')
  })
})

describe('Transfer tests', () => {
  it('rejects an amount over the balance, focuses the field, and sends no request', async () => {
    const transferRequest = vi.fn(() => HttpResponse.json({}))
    server.use(http.post('*/api/transfers', transferRequest))
    const user = renderApp()
    await startTransfer(user)
    await user.type(screen.getByLabelText('Amount'), '4500')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(
      await screen.findByText(`Amount can't be more than your available balance (${moneyText(4280.55)}).`),
    ).toBeVisible()
    expect(screen.getByLabelText('Amount')).toHaveFocus()
    expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Amount')).toHaveAccessibleDescription(
      expect.stringContaining(`Amount can't be more than your available balance (${formatMoney(4280.55)}).`),
    )
    expect(transferRequest).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Confirm transfer' })).not.toBeInTheDocument()
  })

  it('shows success, refreshes balance, transactions and daily limit, and restores focus', async () => {
    const transferRequest = vi.fn()
    server.use(http.post('*/api/transfers', async ({ request }) => {
      transferRequest(await request.clone().json())
    }))
    const user = renderApp()
    await startTransfer(user)
    await user.type(screen.getByLabelText('Amount'), '120')
    await user.type(screen.getByLabelText('Note (optional)'), 'Dinner')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.dblClick(screen.getByRole('button', { name: 'Confirm transfer' }))
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    expect(await screen.findByRole('heading', { name: 'Transfer sent' }, { timeout: 3000 })).toBeVisible()
    expect(screen.getByText(/^TRF-/)).toBeVisible()
    expect(transferRequest).toHaveBeenCalledExactlyOnceWith({
      fromAccountId: 'acc_checking', payeeId: 'pay_001', amount: 120, note: 'Dinner',
    })
    const success = within(screen.getByRole('dialog'))
    expect(success.getByText(moneyText(120))).toBeVisible()
    expect(success.getByText(/to Jamie Tan/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New transfer' })).toHaveFocus()
    expect(screen.getByText(moneyText(17000.55))).toBeVisible()
    expect(screen.getByText(moneyText(4160.55))).toBeVisible()
    expect(screen.getByText(moneyText(4880))).toBeVisible()
    expect(screen.getByText('Transfer to Jamie Tan')).toBeVisible()
  })

  it('keeps review details after an API failure and retries the same transfer successfully', async () => {
    const transferRequest = vi.fn()
    server.use(http.post('*/api/transfers', async ({ request }) => {
      transferRequest(await request.clone().json())
      if (transferRequest.mock.calls.length === 1) {
        return HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
          { status: 500 },
        )
      }
    }))
    const user = renderApp()
    await startTransfer(user)
    await user.type(screen.getByLabelText('Amount'), '50')
    await user.type(screen.getByLabelText('Note (optional)'), 'Dinner')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Something went wrong. Your money hasn't left your account. Try again.",
    )
    expect(screen.getByRole('heading', { name: 'Check the details' })).toBeVisible()
    const review = within(screen.getByRole('dialog'))
    expect(review.getByText(/Everyday Checking/)).toBeVisible()
    expect(review.getByText(/Jamie Tan/)).toBeVisible()
    expect(review.getAllByText(moneyText(50))).toHaveLength(2)
    expect(review.getByText('Dinner')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Transfer sent' })).not.toBeInTheDocument()
    expect(transferRequest).toHaveBeenCalledTimes(1)
    expect(screen.getByText(moneyText(17120.55))).toBeVisible()
    expect(screen.getByText(moneyText(4280.55))).toBeVisible()
    expect(screen.getByText(moneyText(5000))).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Confirm transfer' }))
    expect(await screen.findByRole('heading', { name: 'Transfer sent' }, { timeout: 3000 })).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(transferRequest).toHaveBeenCalledTimes(2)
    expect(transferRequest.mock.calls[1]).toEqual(transferRequest.mock.calls[0])
    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }))
    expect(screen.getByText(moneyText(17070.55))).toBeVisible()
    expect(screen.getByText(moneyText(4230.55))).toBeVisible()
    expect(screen.getByText(moneyText(4950))).toBeVisible()
  })
})
