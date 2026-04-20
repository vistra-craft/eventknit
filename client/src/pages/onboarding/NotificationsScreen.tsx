/**
 * Onboarding Screen 4: Notification Preferences
 *
 * Purpose: Set communication preferences upfront
 * Collects: notificationPreferences - Object with channel preferences
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Mail, Bell, MessageSquare, Newspaper } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboarding } from '@/hooks/useOnboarding';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: typeof Mail;
  defaultValue: boolean;
}

const NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    id: 'email',
    label: 'Email',
    description: 'Event updates and reminders',
    icon: Mail,
    defaultValue: true,
  },
  {
    id: 'push',
    label: 'Push Notifications',
    description: 'Real-time updates on your phone',
    icon: Bell,
    defaultValue: true,
  },
  {
    id: 'sms',
    label: 'SMS (Optional)',
    description: 'Important event reminders',
    icon: MessageSquare,
    defaultValue: false,
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Weekly event recommendations',
    icon: Newspaper,
    defaultValue: false,
  },
];

export const NotificationsScreen = () => {
  const { complete, getStatus, isLoading } = useOnboarding();
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => {
    return NOTIFICATION_PREFERENCES.reduce((acc, pref) => {
      acc[pref.id] = pref.defaultValue;
      return acc;
    }, {} as Record<string, boolean>);
  });

  useEffect(() => {
    // Load saved preferences
    const loadSavedPreferences = async () => {
      try {
        const status = await getStatus();
        if (status.savedPreferences?.notificationPreferences) {
          setPreferences(status.savedPreferences.notificationPreferences);
        }
      } catch (error) {
        console.error('Failed to load saved preferences:', error);
      }
    };

    loadSavedPreferences();
  }, [getStatus]);

  const togglePreference = (id: string) => {
    setPreferences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleComplete = async () => {
    try {
      // Complete onboarding with notification preferences
      await complete({
        notificationPreferences: preferences,
      });
      // Navigation handled by useOnboarding hook
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleSkip = async () => {
    try {
      // Complete onboarding without notification preferences
      await complete({});
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={5}
      title="How would you like to hear from us?"
      subtitle="You can change these anytime in Settings"
      onSkip={handleSkip}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          {NOTIFICATION_PREFERENCES.map((pref) => {
            const Icon = pref.icon;
            const isEnabled = preferences[pref.id];

            return (
              <Card
                key={pref.id}
                className="p-4 transition-all duration-200 hover:shadow-sm cursor-pointer"
                onClick={() => togglePreference(pref.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-card-title">{pref.label}</h3>
                      <p className="text-card-description">
                        {pref.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => togglePreference(pref.id)}
                    className="ml-4"
                  />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <span className="text-lg">💡</span>
          <span>You can customize these preferences anytime in Settings</span>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="flex-1"
            size="lg"
          >
            {isLoading ? 'Completing...' : 'Complete Setup →'}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default NotificationsScreen;
