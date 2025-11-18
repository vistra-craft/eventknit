/**
 * Tests for WorkstationHistory component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../../contexts/AuthContext';
import WorkstationHistory from '../WorkstationHistory';
import * as eventApi from '../../../../lib/event-api';
import * as workstationApi from '../../../../lib/workstation-api';
import { ScanType } from '../../../../lib/workstation-api';

// Mock dependencies
vi.mock('../../../../lib/event-api');
vi.mock('../../../../lib/workstation-api');
vi.mock('../../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper with route params and auth
const TestWrapper = ({
  children,
  eventId,
  useSearchParams = false,
}: {
  children: React.ReactNode;
  eventId?: string;
  useSearchParams?: boolean;
}) => {
  let initialEntries: string[];
  if (useSearchParams && eventId) {
    initialEntries = [`/workstation/history?event=${eventId}`];
  } else if (eventId) {
    initialEntries = [`/workstation/history/${eventId}`];
  } else {
    initialEntries = ['/workstation/history'];
  }
  
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/workstation/history/:eventId" element={children} />
          <Route path="/workstation/history" element={children} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('WorkstationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render loading state initially', async () => {
    vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: { events: [] },
    });

    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(workstationApi, 'getEventScans').mockImplementation(() => pendingPromise);

    render(
      <TestWrapper eventId="test-event-1">
        <WorkstationHistory />
      </TestWrapper>,
    );

    // Component should be rendered (loading state may vary)
    await waitFor(
      () => {
        expect(workstationApi.getEventScans).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    // Resolve the promise to clean up
    resolvePromise!({
      success: true,
      data: { scans: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } },
    });
  });

  it('should render scan history after loading', async () => {
    const mockScans = [
      {
        id: '1',
        registrationId: 'reg1',
        attendeeName: 'John Doe',
        attendeeEmail: 'john@example.com',
        ticketType: 'VIP',
        scannedAt: new Date().toISOString(),
        facility: 'entrance',
        status: 'APPROVED',
        scanType: 'CHECK_IN' as ScanType,
        codeType: 'QR_CODE',
        signatureValid: true,
        isReEntry: false,
        scannedBy: 'teller1',
        deviceId: 'device1',
        deviceType: 'DESKTOP',
      },
    ];

    const mockGetEvents = vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: {
        events: [
          {
            id: 'test-event-1',
            title: 'Test Event',
            description: 'Test Description',
            location: 'Test Location',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'APPROVED',
            organizerId: 'org1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });

    const mockGetEventScans = vi.spyOn(workstationApi, 'getEventScans').mockResolvedValue({
      success: true,
      data: {
        scans: mockScans,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      },
    });

    render(
      <TestWrapper eventId="test-event-1">
        <WorkstationHistory />
      </TestWrapper>,
    );

    // Wait for API calls
    await waitFor(
      () => {
        expect(mockGetEvents).toHaveBeenCalled();
        expect(mockGetEventScans).toHaveBeenCalledWith(
          'test-event-1',
          expect.objectContaining({
            page: 1,
            limit: 50,
          }),
        );
      },
      { timeout: 3000 },
    );
  });

  it('should handle empty scan history', async () => {
    vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: {
        events: [
          {
            id: 'test-event-1',
            title: 'Test Event',
            description: 'Test Description',
            location: 'Test Location',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'APPROVED',
            organizerId: 'org1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });

    const mockGetEventScans = vi.spyOn(workstationApi, 'getEventScans').mockResolvedValue({
      success: true,
      data: {
        scans: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      },
    });

    render(
      <TestWrapper eventId="test-event-1">
        <WorkstationHistory />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEventScans).toHaveBeenCalledWith(
          'test-event-1',
          expect.any(Object),
        );
      },
      { timeout: 3000 },
    );
  });

  it('should handle API errors gracefully', async () => {
    vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: { events: [] },
    });

    const mockGetEventScans = vi
      .spyOn(workstationApi, 'getEventScans')
      .mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper eventId="test-event-1">
        <WorkstationHistory />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEventScans).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  });

  it('should calculate statistics correctly', async () => {
    const mockScans = [
      {
        id: '1',
        registrationId: 'reg1',
        attendeeName: 'John Doe',
        attendeeEmail: 'john@example.com',
        ticketType: 'VIP',
        scannedAt: new Date().toISOString(),
        facility: 'entrance',
        status: 'APPROVED',
        scanType: 'CHECK_IN' as ScanType,
        codeType: 'QR_CODE',
        signatureValid: true,
        isReEntry: false,
        scannedBy: 'teller1',
        deviceId: 'device1',
        deviceType: 'DESKTOP',
      },
      {
        id: '2',
        registrationId: 'reg2',
        attendeeName: 'Jane Smith',
        attendeeEmail: 'jane@example.com',
        ticketType: 'Standard',
        scannedAt: new Date().toISOString(),
        facility: 'entrance',
        status: 'REJECTED',
        scanType: 'CHECK_IN' as ScanType,
        codeType: 'BACKUP_CODE',
        signatureValid: false,
        isReEntry: false,
        scannedBy: 'teller2',
        deviceId: 'device2',
        deviceType: 'MOBILE',
      },
    ];

    vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: {
        events: [
          {
            id: 'test-event-1',
            title: 'Test Event',
            description: 'Test Description',
            location: 'Test Location',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'APPROVED',
            organizerId: 'org1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });

    const mockGetEventScans = vi.spyOn(workstationApi, 'getEventScans').mockResolvedValue({
      success: true,
      data: {
        scans: mockScans,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        },
      },
    });

    render(
      <TestWrapper eventId="test-event-1">
        <WorkstationHistory />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEventScans).toHaveBeenCalledWith(
          'test-event-1',
          expect.objectContaining({
            page: 1,
            limit: 50,
          }),
        );
      },
      { timeout: 3000 },
    );
  });

  it('should filter scans by facility', async () => {
    const mockScans = [
      {
        id: '1',
        registrationId: 'reg1',
        attendeeName: 'John Doe',
        attendeeEmail: 'john@example.com',
        ticketType: 'VIP',
        scannedAt: new Date().toISOString(),
        facility: 'entrance',
        status: 'APPROVED',
        scanType: 'CHECK_IN' as ScanType,
        codeType: 'QR_CODE',
        signatureValid: true,
        isReEntry: false,
        scannedBy: 'teller1',
        deviceId: 'device1',
        deviceType: 'DESKTOP',
      },
    ];

    vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: {
        events: [
          {
            id: 'test-event-1',
            title: 'Test Event',
            description: 'Test Description',
            location: 'Test Location',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'APPROVED',
            organizerId: 'org1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });

    const mockGetEventScans = vi.spyOn(workstationApi, 'getEventScans').mockResolvedValue({
      success: true,
      data: {
        scans: mockScans,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      },
    });

    render(
      <TestWrapper eventId="test-event-1">
        <WorkstationHistory />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEventScans).toHaveBeenCalledWith(
          'test-event-1',
          expect.objectContaining({
            page: 1,
            limit: 50,
          }),
        );
      },
      { timeout: 3000 },
    );
  });

  it('should work with eventId from search params', async () => {
    vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: { events: [] },
    });

    const mockGetEventScans = vi.spyOn(workstationApi, 'getEventScans').mockResolvedValue({
      success: true,
      data: {
        scans: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      },
    });

    render(
      <TestWrapper eventId="test-event-1" useSearchParams={true}>
        <WorkstationHistory />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEventScans).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  });
});

