import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TicketViewPage from '../TicketViewPage';
import * as ticketApi from '@/lib/ticket-api';
import * as eventApi from '@/lib/event-api';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock dependencies
vi.mock('@/lib/ticket-api');
vi.mock('@/lib/event-api');
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

let mockLocation: {
  state?: Record<string, unknown> | null;
  pathname?: string;
  search?: string;
  hash?: string;
};
let mockNavigate = vi.fn();
let mockParams: { registrationId?: string } = {};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation,
    useParams: () => mockParams,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockGetTicket = ticketApi.getTicket as ReturnType<typeof vi.fn>;
const mockGetTicketPublic = ticketApi.getTicketPublic as ReturnType<typeof vi.fn>;
const mockGetEventById = eventApi.getEventById as ReturnType<typeof vi.fn>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('TicketViewPage', () => {
  const mockTicket = {
    id: 'test-registration-id',
    registrationId: 'test-registration-id',
    eventId: 'test-event-id',
    eventTitle: 'Test Event',
    attendeeName: 'John Doe',
    attendeeEmail: 'john@test.com',
    ticketType: 'General Admission',
    qrCode: 'data:image/png;base64,test-qr-code',
    backupCode: 'ABC123',
    createdAt: new Date().toISOString(),
  };

  const mockEvent = {
    id: 'test-event-id',
    title: 'Test Event',
    startDate: new Date().toISOString(),
    startTime: '10:00',
    location: 'Test Location',
    venue: 'Test Venue',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTicket.mockReset();
    mockGetTicketPublic.mockReset();
    mockGetEventById.mockReset();
    mockLocation = {
      state: null,
      pathname: '/user/tickets/test-registration-id',
      search: '',
      hash: '',
    };
    mockParams = { registrationId: 'test-registration-id' };
    mockNavigate = vi.fn();
  });

  it('should render loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-id', email: 'user@test.com' },
      isAuthenticated: true,
    });
    mockGetTicket.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<TicketViewPage />);

    expect(screen.getByText('Loading ticket...')).toBeInTheDocument();
  });

  it('should display ticket when authenticated user loads ticket', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-id', email: 'user@test.com' },
      isAuthenticated: true,
    });
    mockGetTicket.mockResolvedValue({
      success: true,
      data: mockTicket,
    });
    mockGetEventById.mockResolvedValue({
      success: true,
      data: { event: mockEvent },
    });

    renderWithRouter(<TicketViewPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  it('should use public endpoint when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
    mockGetTicketPublic.mockResolvedValue({
      success: true,
      data: mockTicket,
    });
    mockGetEventById.mockResolvedValue({
      success: true,
      data: { event: mockEvent },
    });

    // Provide email via mocked location
    mockLocation = {
      state: { userEmail: 'john@test.com' },
      pathname: '/user/tickets/test-registration-id',
      search: '',
      hash: '',
    };

    renderWithRouter(<TicketViewPage />);

    await waitFor(() => {
      expect(mockGetTicketPublic).toHaveBeenCalledWith('test-registration-id', 'john@test.com');
    });
  });

  it('should display error when ticket not found', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-id', email: 'user@test.com' },
      isAuthenticated: true,
    });
    mockGetTicket.mockRejectedValue(new Error('Ticket not found'));

    renderWithRouter(<TicketViewPage />);

    await waitFor(() => {
      expect(screen.getByText(/Ticket not found/i)).toBeInTheDocument();
    });
  });

  it('should display QR code when available', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-id', email: 'user@test.com' },
      isAuthenticated: true,
    });
    mockGetTicket.mockResolvedValue({
      success: true,
      data: mockTicket,
    });
    mockGetEventById.mockResolvedValue({
      success: true,
      data: { event: mockEvent },
    });

    renderWithRouter(<TicketViewPage />);

    await waitFor(() => {
      const qrImage = screen.getByAltText('Ticket QR Code');
      expect(qrImage).toBeInTheDocument();
      expect(qrImage).toHaveAttribute('src', 'data:image/png;base64,test-qr-code');
    });
  });

  it('should display backup code when available', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-id', email: 'user@test.com' },
      isAuthenticated: true,
    });
    mockGetTicket.mockResolvedValue({
      success: true,
      data: mockTicket,
    });
    mockGetEventById.mockResolvedValue({
      success: true,
      data: { event: mockEvent },
    });

    renderWithRouter(<TicketViewPage />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });
  });
});


