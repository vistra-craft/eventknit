import { AutoPayoutJob } from '../../../src/jobs/auto-payout.job.js';
import { prisma } from '../../../src/config/database.js';
import { config } from '../../../src/config/index.js';
import { logger } from '../../../src/utils/logger.js';
import { DisbursementService } from '../../../src/services/disbursement.service.js';
import { PayoutManagementService } from '../../../src/services/payout-management.service.js';
import { PlatformFeeService } from '../../../src/services/platform-fee.service.js';
import { NotificationService } from '../../../src/services/notification.service.js';
import { emailService } from '../../../src/services/email.service.js';
import { NotificationType, NotificationPriority } from '@prisma/client';
import * as cron from 'node-cron';
import * as auditModule from '../../../src/utils/audit.js';

// Mock dependencies
jest.mock('../../../src/config/database.js', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    event: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../../src/config/index.js', () => ({
  config: {
    payout: {
      autoPayoutEnabled: true,
      gracePeriodBusinessDays: 5,
    },
  },
}));

jest.mock('../../../src/services/disbursement.service.js', () => ({
  DisbursementService: {
    createDisbursement: jest.fn(),
    getScheduledDisbursementsReadyToProcess: jest.fn(),
  },
}));

jest.mock('../../../src/services/payout-management.service.js', () => ({
  PayoutManagementService: {
    getPayoutPreferences: jest.fn(),
  },
}));

jest.mock('../../../src/services/platform-fee.service.js', () => ({
  PlatformFeeService: {
    getPendingDisbursementFees: jest.fn(),
  },
}));

jest.mock('../../../src/services/notification.service.js', () => ({
  NotificationService: {
    sendNotification: jest.fn(),
  },
}));

jest.mock('../../../src/services/email.service.js', () => ({
  emailService: {
    sendPayoutInitiatedEmail: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../src/utils/audit.js', () => ({
  createAuditLog: jest.fn(),
  AuditActions: {
    DISBURSEMENT_AUTO_CREATED: 'DISBURSEMENT_AUTO_CREATED',
  },
}));

jest.mock('node-cron');

describe('AutoPayoutJob', () => {
  let mockScheduledTask: any;

  const mockOrganizer = {
    id: 'org-1',
    email: 'organizer@test.com',
    firstName: 'Test',
    lastName: 'Organizer',
    organizationName: 'Test Org',
    isIdentityVerified: true,
    kycStatus: 'APPROVED',
  };

  const mockEligibleEvent = {
    id: 'event-1',
    title: 'Past Event',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-01-16'),
    organizerId: 'org-1',
    currency: 'NGN',
    organizer: mockOrganizer,
  };

  const mockPayoutPreferences = {
    id: 'pref-1',
    organizerId: 'org-1',
    primaryMethod: 'bank_transfer',
    bankName: 'Test Bank',
    accountName: 'Test Account',
    accountNumber: '1234567890',
    autoPayoutEnabled: true,
    autoPayoutThreshold: null,
  };

  const mockPendingFees = [
    {
      id: 'fee-1',
      organizerAmount: 9000,
      currency: 'NGN',
      eventId: 'event-1',
    },
    {
      id: 'fee-2',
      organizerAmount: 4500,
      currency: 'NGN',
      eventId: 'event-1',
    },
  ];

  const mockDisbursement = {
    id: 'disb-1',
    disbursementNumber: 'DISB-2026-000001',
    totalAmount: 13500,
    status: 'pending',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: database available
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

    // Default: auto-payout enabled
    (config as any).payout.autoPayoutEnabled = true;
    (config as any).payout.gracePeriodBusinessDays = 5;

    // Default: no eligible events
    (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

    // Default: no scheduled disbursements
    (DisbursementService.getScheduledDisbursementsReadyToProcess as jest.Mock).mockResolvedValue([]);

    // Create mock cron task
    mockScheduledTask = { stop: jest.fn() };
    (cron.schedule as jest.Mock).mockReturnValue(mockScheduledTask);
  });

  afterEach(() => {
    AutoPayoutJob.stop();
  });

  // ─── Lifecycle ───

  describe('start', () => {
    it('should start the auto-payout job with correct cron schedule', () => {
      AutoPayoutJob.start();

      expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith('✅ Auto-payout job started');
    });

    it('should warn if job is already running', () => {
      AutoPayoutJob.start();
      jest.clearAllMocks();

      AutoPayoutJob.start();

      expect(logger.warn).toHaveBeenCalledWith('Auto-payout job is already running');
      expect(cron.schedule).not.toHaveBeenCalled();
    });

    it('should handle cron start errors', () => {
      const error = new Error('Cron failed');
      (cron.schedule as jest.Mock).mockImplementation(() => { throw error; });

      expect(() => AutoPayoutJob.start()).toThrow(error);
      expect(logger.error).toHaveBeenCalledWith('Failed to start auto-payout job:', error);
    });
  });

  describe('stop', () => {
    it('should stop the job successfully', () => {
      AutoPayoutJob.start();
      jest.clearAllMocks();

      AutoPayoutJob.stop();

      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith('Auto-payout job stopped');
    });

    it('should do nothing if job is not running', () => {
      AutoPayoutJob.stop();

      expect(mockScheduledTask.stop).not.toHaveBeenCalled();
    });
  });

  // ─── processAutoPayouts ───

  describe('processAutoPayouts', () => {
    it('should skip if database is not available', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB down'));

      await AutoPayoutJob.processAutoPayouts();

      expect(logger.warn).toHaveBeenCalledWith('Database not available, skipping auto-payout job');
      expect(prisma.event.findMany).not.toHaveBeenCalled();
    });

    it('should skip if auto-payout is disabled system-wide', async () => {
      (config as any).payout.autoPayoutEnabled = false;

      await AutoPayoutJob.processAutoPayouts();

      expect(logger.debug).toHaveBeenCalledWith('Auto-payout is disabled system-wide, skipping');
      expect(prisma.event.findMany).not.toHaveBeenCalled();
    });

    it('should handle database connection errors gracefully', async () => {
      const dbError = new Error('Can\'t reach database server');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (prisma.event.findMany as jest.Mock).mockRejectedValue(dbError);

      await AutoPayoutJob.processAutoPayouts();

      expect(logger.warn).toHaveBeenCalledWith(
        'Database connection error during auto-payout job, skipping this run:',
        dbError.message,
      );
    });

    it('should log debug when nothing to process', async () => {
      await AutoPayoutJob.processAutoPayouts();

      expect(logger.debug).toHaveBeenCalledWith('No auto-payouts or scheduled disbursements to process');
    });
  });

  // ─── Auto-payout creation ───

  describe('auto-payout creation', () => {
    it('should skip organizers without identity verification', async () => {
      const unverifiedEvent = {
        ...mockEligibleEvent,
        organizer: { ...mockOrganizer, isIdentityVerified: false },
      };
      (prisma.event.findMany as jest.Mock).mockResolvedValue([unverifiedEvent]);

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('not identity-verified'),
      );
    });

    it('should skip organizers without approved KYC', async () => {
      const pendingKycEvent = {
        ...mockEligibleEvent,
        organizer: { ...mockOrganizer, kycStatus: 'PENDING' },
      };
      (prisma.event.findMany as jest.Mock).mockResolvedValue([pendingKycEvent]);

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('KYC not approved'),
      );
    });

    it('should skip organizers with autoPayoutEnabled = false', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue({
        ...mockPayoutPreferences,
        autoPayoutEnabled: false,
      });

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Auto-payout disabled'),
      );
    });

    it('should skip organizers without complete bank details', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue({
        ...mockPayoutPreferences,
        bankName: null,
        accountNumber: null,
      });

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Incomplete bank details'),
      );
    });

    it('should skip events with no pending fees', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue([]);

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('No pending fees'),
      );
    });

    it('should skip events where payout amount is below threshold', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue({
        ...mockPayoutPreferences,
        autoPayoutThreshold: 50000, // Higher than the 13500 total
      });
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('below threshold'),
      );
    });

    it('should create disbursement for eligible event with correct data', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);
      (DisbursementService.createDisbursement as jest.Mock).mockResolvedValue(mockDisbursement);

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).toHaveBeenCalledWith(
        {
          eventId: 'event-1',
          organizerId: 'org-1',
          paymentMethod: 'bank_transfer',
          bankName: 'Test Bank',
          accountName: 'Test Account',
          accountNumber: '1234567890',
          notes: expect.stringContaining('Automatic post-event payout'),
        },
        null, // createdBy is null for automated payouts
      );
    });

    it('should create audit log with automated flag', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);
      (DisbursementService.createDisbursement as jest.Mock).mockResolvedValue(mockDisbursement);

      await AutoPayoutJob.processAutoPayouts();

      expect(auditModule.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'org-1',
          action: 'DISBURSEMENT_AUTO_CREATED',
          entity: 'OrganizerDisbursement',
          entityId: 'disb-1',
          metadata: expect.objectContaining({
            automated: true,
            feeCount: 2,
          }),
        }),
      );
    });

    it('should send in-app notification on successful payout creation', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);
      (DisbursementService.createDisbursement as jest.Mock).mockResolvedValue(mockDisbursement);

      await AutoPayoutJob.processAutoPayouts();

      expect(NotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'org-1',
          type: NotificationType.PAYOUT_INITIATED,
          priority: NotificationPriority.HIGH,
          eventId: 'event-1',
          data: expect.objectContaining({
            disbursementId: 'disb-1',
            amount: 13500,
            currency: 'NGN',
          }),
        }),
      );
    });

    it('should send email notification on successful payout creation', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);
      (DisbursementService.createDisbursement as jest.Mock).mockResolvedValue(mockDisbursement);

      await AutoPayoutJob.processAutoPayouts();

      expect(emailService.sendPayoutInitiatedEmail).toHaveBeenCalledWith(
        'organizer@test.com',
        expect.objectContaining({
          organizerName: 'Test Org',
          eventTitle: 'Past Event',
          disbursementNumber: 'DISB-2026-000001',
          accountNumber: '****7890',
        }),
      );
    });

    it('should process multiple events independently', async () => {
      const event2 = {
        ...mockEligibleEvent,
        id: 'event-2',
        title: 'Another Past Event',
        organizerId: 'org-2',
        organizer: { ...mockOrganizer, id: 'org-2', email: 'org2@test.com' },
      };

      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent, event2]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);
      (DisbursementService.createDisbursement as jest.Mock).mockResolvedValue(mockDisbursement);

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.createDisbursement).toHaveBeenCalledTimes(2);
    });

    it('should continue processing other events when one fails', async () => {
      const event2 = {
        ...mockEligibleEvent,
        id: 'event-2',
        title: 'Second Event',
      };

      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent, event2]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);
      (DisbursementService.createDisbursement as jest.Mock)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(mockDisbursement);

      await AutoPayoutJob.processAutoPayouts();

      // First call failed, second succeeded
      expect(DisbursementService.createDisbursement).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create auto-payout for event event-1'),
        expect.any(Error),
      );
    });

    it('should log summary when payouts are created', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEligibleEvent]);
      (PayoutManagementService.getPayoutPreferences as jest.Mock).mockResolvedValue(mockPayoutPreferences);
      (PlatformFeeService.getPendingDisbursementFees as jest.Mock).mockResolvedValue(mockPendingFees);
      (DisbursementService.createDisbursement as jest.Mock).mockResolvedValue(mockDisbursement);

      await AutoPayoutJob.processAutoPayouts();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created 1 auto-payouts'),
      );
    });
  });

  // ─── Scheduled disbursements ───

  describe('scheduled disbursements', () => {
    it('should process scheduled disbursements that are ready', async () => {
      const scheduledDisbursement = {
        id: 'disb-scheduled-1',
        event: { id: 'event-3', title: 'Scheduled Event' },
        organizer: { id: 'org-3', email: 'org3@test.com', organizationName: 'Org 3' },
      };

      (DisbursementService.getScheduledDisbursementsReadyToProcess as jest.Mock)
        .mockResolvedValue([scheduledDisbursement]);

      await AutoPayoutJob.processAutoPayouts();

      expect(DisbursementService.getScheduledDisbursementsReadyToProcess).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Scheduled disbursement disb-scheduled-1 is ready to process'),
      );
    });

    it('should handle errors per scheduled disbursement', async () => {
      (DisbursementService.getScheduledDisbursementsReadyToProcess as jest.Mock)
        .mockResolvedValue([
          { id: 'disb-s1', event: { title: 'E1' }, organizer: { email: 'o1@t.com' } },
        ]);

      // Force the logger to throw to simulate a processing error
      const _originalInfo = logger.info;
      let callCount = 0;
      (logger.info as jest.Mock).mockImplementation((...args: any[]) => {
        callCount++;
        if (callCount === 2 && typeof args[0] === 'string' && args[0].includes('Scheduled disbursement')) {
          throw new Error('Processing failed');
        }
      });

      await AutoPayoutJob.processAutoPayouts();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to process scheduled disbursement'),
        expect.any(Error),
      );
    });
  });
});
