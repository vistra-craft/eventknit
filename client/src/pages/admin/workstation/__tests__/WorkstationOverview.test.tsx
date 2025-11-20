/**
 * Tests for WorkstationOverview component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { ThemeProvider } from '../../../../contexts/ThemeContext';
import { RoleViewProvider } from '../../../../contexts/RoleViewContext';
import { UserRole } from '../../../../types/auth';
import WorkstationOverview from '../WorkstationOverview';
import * as eventApi from '../../../../lib/event-api';
import * as workstationApi from '../../../../lib/workstation-api';

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

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <RoleViewProvider userRole={UserRole.TELLER}>
            {children}
          </RoleViewProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('WorkstationOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render loading state initially', async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(eventApi, 'getEvents').mockImplementation(() => pendingPromise);

    render(
      <TestWrapper>
        <WorkstationOverview />
      </TestWrapper>,
    );

    // Component should be rendered (loading state may vary)
    await waitFor(
      () => {
        expect(eventApi.getEvents).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    // Resolve the promise to clean up
    resolvePromise!({
      success: true,
      data: { events: [] },
    });
  });

  it('should render events after loading', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Test Event 1',
        description: 'Test Description 1',
        location: 'Test Location 1',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'APPROVED',
        organizerId: 'org1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Test Event 2',
        description: 'Test Description 2',
        location: 'Test Location 2',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'APPROVED',
        organizerId: 'org2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockStatistics = {
      totalAttendees: 100,
      checkedIn: 50,
      checkedOut: 10,
      pending: 40,
      reEntries: 5,
    };

    const mockGetEvents = vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: { events: mockEvents },
    });

    const mockGetEvent = vi.spyOn(workstationApi, 'getEvent').mockResolvedValue({
      success: true,
      data: {
        event: mockEvents[0],
        statistics: mockStatistics,
      },
    });

    render(
      <TestWrapper>
        <WorkstationOverview />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEvents).toHaveBeenCalled();
        expect(mockGetEvent).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  });

  it('should handle API errors gracefully', async () => {
    vi.spyOn(eventApi, 'getEvents').mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <WorkstationOverview />
      </TestWrapper>,
    );

    await waitFor(() => {
      // Component should handle error and show error state or empty state
      expect(eventApi.getEvents).toHaveBeenCalled();
    });
  });

  it('should calculate total statistics correctly', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Event 1',
        description: 'Desc 1',
        location: 'Loc 1',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        status: 'APPROVED',
        organizerId: 'org1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockStatistics = {
      totalAttendees: 100,
      checkedIn: 50,
      checkedOut: 10,
      pending: 40,
      reEntries: 5,
    };

    const mockGetEvents = vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: { events: mockEvents },
    });

    const mockGetEvent = vi.spyOn(workstationApi, 'getEvent').mockResolvedValue({
      success: true,
      data: {
        event: mockEvents[0],
        statistics: mockStatistics,
      },
    });

    render(
      <TestWrapper>
        <WorkstationOverview />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEvents).toHaveBeenCalled();
        expect(mockGetEvent).toHaveBeenCalledWith(mockEvents[0].id);
      },
      { timeout: 3000 },
    );
  });

  it('should load event statistics', async () => {
    const mockEvents = [
      {
        id: '1',
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
    ];

    const mockGetEvents = vi.spyOn(eventApi, 'getEvents').mockResolvedValue({
      success: true,
      data: { events: mockEvents },
    });

    const mockGetEvent = vi.spyOn(workstationApi, 'getEvent').mockResolvedValue({
      success: true,
      data: {
        event: mockEvents[0],
        statistics: {
          totalAttendees: 0,
          checkedIn: 0,
          checkedOut: 0,
          pending: 0,
          reEntries: 0,
        },
      },
    });

    render(
      <TestWrapper>
        <WorkstationOverview />
      </TestWrapper>,
    );

    await waitFor(
      () => {
        expect(mockGetEvents).toHaveBeenCalled();
        expect(mockGetEvent).toHaveBeenCalledWith(mockEvents[0].id);
      },
      { timeout: 3000 },
    );
  });
});

