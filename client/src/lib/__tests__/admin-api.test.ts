/**
 * Tests for admin API functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bulkUpdateOrganizerDataAccess, updateOrganizerDataAccess } from '../admin-api';
import * as api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  apiPut: vi.fn(),
}));

describe('Admin API - Organizer Data Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateOrganizerDataAccess', () => {
    it('should call apiPut with correct parameters', async () => {
      const mockResponse = {
        success: true,
        message: 'Data access updated successfully',
        data: {
          event: {
            id: 'event-123',
            organizerDataAccess: 'STANDARD',
          },
        },
      };

      vi.mocked(api.apiPut).mockResolvedValue(mockResponse);

      const result = await updateOrganizerDataAccess('event-123', 'STANDARD');

      expect(api.apiPut).toHaveBeenCalledWith(
        '/events/event-123/organizer-data-access',
        { dataAccessLevel: 'STANDARD' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle RESTRICTED access level', async () => {
      const mockResponse = {
        success: true,
        message: 'Data access updated successfully',
        data: {
          event: {
            id: 'event-123',
            organizerDataAccess: 'RESTRICTED',
          },
        },
      };

      vi.mocked(api.apiPut).mockResolvedValue(mockResponse);

      const result = await updateOrganizerDataAccess('event-123', 'RESTRICTED');

      expect(api.apiPut).toHaveBeenCalledWith(
        '/events/event-123/organizer-data-access',
        { dataAccessLevel: 'RESTRICTED' }
      );
      expect(result.data.event.organizerDataAccess).toBe('RESTRICTED');
    });

    it('should handle FULL access level', async () => {
      const mockResponse = {
        success: true,
        message: 'Data access updated successfully',
        data: {
          event: {
            id: 'event-123',
            organizerDataAccess: 'FULL',
          },
        },
      };

      vi.mocked(api.apiPut).mockResolvedValue(mockResponse);

      const result = await updateOrganizerDataAccess('event-123', 'FULL');

      expect(api.apiPut).toHaveBeenCalledWith(
        '/events/event-123/organizer-data-access',
        { dataAccessLevel: 'FULL' }
      );
      expect(result.data.event.organizerDataAccess).toBe('FULL');
    });
  });

  describe('bulkUpdateOrganizerDataAccess', () => {
    it('should call apiPut with correct parameters for bulk update', async () => {
      const mockResponse = {
        success: true,
        message: 'Data access updated successfully for 2 event(s)',
        data: {
          updatedCount: 2,
          eventIds: ['event-1', 'event-2'],
        },
      };

      vi.mocked(api.apiPut).mockResolvedValue(mockResponse);

      const result = await bulkUpdateOrganizerDataAccess(
        ['event-1', 'event-2'],
        'STANDARD'
      );

      expect(api.apiPut).toHaveBeenCalledWith(
        '/events/bulk/organizer-data-access',
        {
          eventIds: ['event-1', 'event-2'],
          dataAccessLevel: 'STANDARD',
        }
      );
      expect(result).toEqual(mockResponse);
      expect(result.data.updatedCount).toBe(2);
      expect(result.data.eventIds).toHaveLength(2);
    });

    it('should handle single event bulk update', async () => {
      const mockResponse = {
        success: true,
        message: 'Data access updated successfully for 1 event(s)',
        data: {
          updatedCount: 1,
          eventIds: ['event-1'],
        },
      };

      vi.mocked(api.apiPut).mockResolvedValue(mockResponse);

      const result = await bulkUpdateOrganizerDataAccess(['event-1'], 'FULL');

      expect(api.apiPut).toHaveBeenCalledWith(
        '/events/bulk/organizer-data-access',
        {
          eventIds: ['event-1'],
          dataAccessLevel: 'FULL',
        }
      );
      expect(result.data.updatedCount).toBe(1);
    });

    it('should handle multiple events with RESTRICTED access level', async () => {
      const mockResponse = {
        success: true,
        message: 'Data access updated successfully for 3 event(s)',
        data: {
          updatedCount: 3,
          eventIds: ['event-1', 'event-2', 'event-3'],
        },
      };

      vi.mocked(api.apiPut).mockResolvedValue(mockResponse);

      const result = await bulkUpdateOrganizerDataAccess(
        ['event-1', 'event-2', 'event-3'],
        'RESTRICTED'
      );

      expect(api.apiPut).toHaveBeenCalledWith(
        '/events/bulk/organizer-data-access',
        {
          eventIds: ['event-1', 'event-2', 'event-3'],
          dataAccessLevel: 'RESTRICTED',
        }
      );
      expect(result.data.updatedCount).toBe(3);
    });

    it('should propagate errors from apiPut', async () => {
      const mockError = new Error('Network error');
      vi.mocked(api.apiPut).mockRejectedValue(mockError);

      await expect(
        bulkUpdateOrganizerDataAccess(['event-1'], 'STANDARD')
      ).rejects.toThrow('Network error');
    });
  });
});


