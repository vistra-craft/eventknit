import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../src/config/database.js';
import { SystemSettingsService } from '../src/services/system-settings.service.js';
import { ValidationError, NotFoundError } from '../src/utils/errors.js';

describe('SystemSettingsService', () => {
  beforeEach(async () => {
    // Clean up settings before each test
    await prisma.settingsHistory.deleteMany({});
    await prisma.systemSettings.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.settingsHistory.deleteMany({});
    await prisma.systemSettings.deleteMany({});
  });

  describe('setSetting', () => {
    it('should create a new string setting', async () => {
      const setting = await SystemSettingsService.setSetting(
        'test.string',
        'test value',
        'string',
        'general',
        'test-user-id',
        { description: 'Test string setting' },
      );

      expect(setting.key).toBe('test.string');
      expect(setting.value).toBe('test value');
      expect(setting.type).toBe('string');
      expect(setting.category).toBe('general');
      expect(setting.description).toBe('Test string setting');
    });

    it('should create a new number setting', async () => {
      const setting = await SystemSettingsService.setSetting(
        'test.number',
        42,
        'number',
        'general',
        'test-user-id',
      );

      expect(setting.key).toBe('test.number');
      expect(setting.value).toBe(42);
      expect(setting.type).toBe('number');
    });

    it('should create a new boolean setting', async () => {
      const setting = await SystemSettingsService.setSetting(
        'test.boolean',
        true,
        'boolean',
        'general',
        'test-user-id',
      );

      expect(setting.key).toBe('test.boolean');
      expect(setting.value).toBe(true);
      expect(setting.type).toBe('boolean');
    });

    it('should create a new JSON setting', async () => {
      const jsonValue = { key: 'value', nested: { data: 123 } };
      const setting = await SystemSettingsService.setSetting(
        'test.json',
        jsonValue,
        'json',
        'general',
        'test-user-id',
      );

      expect(setting.key).toBe('test.json');
      expect(setting.value).toEqual(jsonValue);
      expect(setting.type).toBe('json');
    });

    it('should update an existing setting', async () => {
      // Create initial setting
      await SystemSettingsService.setSetting(
        'test.update',
        'initial',
        'string',
        'general',
        'test-user-id',
      );

      // Update it
      const updated = await SystemSettingsService.setSetting(
        'test.update',
        'updated',
        'string',
        'general',
        'test-user-id',
      );

      expect(updated.value).toBe('updated');
    });

    it('should validate string type', async () => {
      await expect(
        SystemSettingsService.setSetting(
          'test.invalid',
          123, // number instead of string
          'string',
          'general',
          'test-user-id',
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate number type', async () => {
      await expect(
        SystemSettingsService.setSetting(
          'test.invalid',
          'not a number',
          'number',
          'general',
          'test-user-id',
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate boolean type', async () => {
      await expect(
        SystemSettingsService.setSetting(
          'test.invalid',
          'not a boolean',
          'boolean',
          'general',
          'test-user-id',
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should create history entry when setting is updated', async () => {
      // Create initial setting
      await SystemSettingsService.setSetting(
        'test.history',
        'initial',
        'string',
        'general',
        'test-user-id',
      );

      // Update it
      await SystemSettingsService.setSetting(
        'test.history',
        'updated',
        'string',
        'general',
        'test-user-id',
        { changeReason: 'Testing history' },
      );

      const history = await SystemSettingsService.getSettingsHistory('test.history', 10);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].changeReason).toBe('Testing history');
    });
  });

  describe('getSetting', () => {
    it('should retrieve an existing setting', async () => {
      await SystemSettingsService.setSetting(
        'test.get',
        'test value',
        'string',
        'general',
        'test-user-id',
      );

      const setting = await SystemSettingsService.getSetting('test.get');

      expect(setting).not.toBeNull();
      expect(setting?.key).toBe('test.get');
      expect(setting?.value).toBe('test value');
    });

    it('should return null for non-existent setting', async () => {
      const setting = await SystemSettingsService.getSetting('test.nonexistent');
      expect(setting).toBeNull();
    });

    it('should prefer environment-specific setting', async () => {
      // Create general setting
      await SystemSettingsService.setSetting(
        'test.env',
        'general value',
        'string',
        'general',
        'test-user-id',
      );

      // Create environment-specific setting
      await SystemSettingsService.setSetting(
        'test.env',
        'dev value',
        'string',
        'general',
        'test-user-id',
        { environment: 'dev' },
      );

      const setting = await SystemSettingsService.getSetting('test.env', 'dev');
      expect(setting?.value).toBe('dev value');
    });
  });

  describe('getSettings', () => {
    it('should retrieve all settings', async () => {
      await SystemSettingsService.setSetting(
        'test.all1',
        'value1',
        'string',
        'general',
        'test-user-id',
      );
      await SystemSettingsService.setSetting(
        'test.all2',
        'value2',
        'string',
        'users',
        'test-user-id',
      );

      const settings = await SystemSettingsService.getSettings();
      expect(settings.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by category', async () => {
      await SystemSettingsService.setSetting(
        'test.cat1',
        'value1',
        'string',
        'general',
        'test-user-id',
      );
      await SystemSettingsService.setSetting(
        'test.cat2',
        'value2',
        'string',
        'users',
        'test-user-id',
      );

      const settings = await SystemSettingsService.getSettings('general');
      expect(settings.every(s => s.category === 'general')).toBe(true);
    });
  });

  describe('deleteSetting', () => {
    it('should delete an existing setting', async () => {
      await SystemSettingsService.setSetting(
        'test.delete',
        'value',
        'string',
        'general',
        'test-user-id',
      );

      await SystemSettingsService.deleteSetting('test.delete', 'test-user-id');

      const setting = await SystemSettingsService.getSetting('test.delete');
      expect(setting).toBeNull();
    });

    it('should throw NotFoundError for non-existent setting', async () => {
      await expect(
        SystemSettingsService.deleteSetting('test.nonexistent', 'test-user-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPublicSettings', () => {
    it('should return only public settings', async () => {
      await SystemSettingsService.setSetting(
        'test.public',
        'public value',
        'string',
        'general',
        'test-user-id',
        { isPublic: true },
      );
      await SystemSettingsService.setSetting(
        'test.private',
        'private value',
        'string',
        'general',
        'test-user-id',
        { isPublic: false },
      );

      const publicSettings = await SystemSettingsService.getPublicSettings();
      expect(publicSettings['test.public']).toBe('public value');
      expect(publicSettings['test.private']).toBeUndefined();
    });
  });

  describe('setSettings (bulk)', () => {
    it('should update multiple settings at once', async () => {
      const settings = await SystemSettingsService.setSettings(
        [
          {
            key: 'test.bulk1',
            value: 'value1',
            type: 'string',
            category: 'general',
          },
          {
            key: 'test.bulk2',
            value: 'value2',
            type: 'string',
            category: 'general',
          },
        ],
        'test-user-id',
        'Bulk update test',
      );

      expect(settings.length).toBe(2);
      expect(settings[0].key).toBe('test.bulk1');
      expect(settings[1].key).toBe('test.bulk2');
    });
  });
});


