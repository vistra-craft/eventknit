import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DigitalWallet from '../DigitalWallet'
import { vi } from 'vitest'

vi.mock('@/lib/user-dashboard-api', () => ({
  getWallet: vi.fn(),
  addTicketToWallet: vi.fn(),
  removeTicketFromWallet: vi.fn(),
  updateWalletPreferences: vi.fn(),
  generateAppleWalletPass: vi.fn(),
  generateGooglePayPass: vi.fn(),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

const api = await import('@/lib/user-dashboard-api')

describe('DigitalWallet', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => null)
    vi.spyOn(window, 'confirm').mockImplementation(() => true)
  })

  it('loads and shows wallet tickets', async () => {
    ;(api.getWallet as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        wallet: {
          id: 'wallet-1',
          userId: 'user-1',
          autoAddTickets: true,
          backupEnabled: false,
          walletTickets: [
            {
              id: 'wt-1',
              registrationId: 'reg-1',
              backupCode: 'ABC',
              isActive: true,
              addedAt: new Date().toISOString(),
              registration: {
                id: 'reg-1',
                event: {
                  id: 'evt-1',
                  title: 'Sample Event',
                  startDate: new Date().toISOString(),
                  location: 'NYC',
                },
              },
            },
          ],
        },
      },
    })

    render(<DigitalWallet />)

    expect(screen.getByText(/Digital Wallet/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Sample Event/i)).toBeInTheDocument()
    })
  })

  it('handles load error with toast', async () => {
    ;(api.getWallet as vi.Mock).mockRejectedValue(new Error('fail'))
    const toastSpy = vi.fn()
    vi.mocked(await import('@/hooks/useToast')).useToast = () => ({ toast: toastSpy } as { toast: (options?: unknown) => void })

    render(<DigitalWallet />)

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled()
    })
  })

  it('updates preferences from settings tab', async () => {
    ;(api.getWallet as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        wallet: {
          id: 'wallet-1',
          userId: 'user-1',
          autoAddTickets: false,
          backupEnabled: false,
          walletTickets: [],
        },
      },
    })
    ;(api.updateWalletPreferences as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        wallet: {
          id: 'wallet-1',
          userId: 'user-1',
          autoAddTickets: true,
          backupEnabled: true,
          walletTickets: [],
        },
      },
    })

    render(<DigitalWallet />)

    const settingsBtn = screen.getByRole('button', { name: /Settings/i })
    await userEvent.click(settingsBtn)

    const autoAddToggle = screen.getByLabelText(/Auto-add tickets/i)
    await userEvent.click(autoAddToggle)

    await waitFor(() => {
      expect(api.updateWalletPreferences).toHaveBeenCalled()
    })
  })
})

