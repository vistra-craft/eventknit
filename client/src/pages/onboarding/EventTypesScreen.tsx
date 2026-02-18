/**
 * Onboarding Screen 2B: Event Type Selection
 *
 * Shown when: User selected "Organize events" or "Both"
 * Purpose: Understand what type of events they want to create
 * Collects: organizerEventTypes - Array of event type IDs
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Users, MapPin, Globe } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboarding } from '@/hooks/useOnboarding';

const EVENT_TYPES = [
  {
    id: 'public',
    label: 'Public Events',
    description: 'Concerts, festivals, conferences',
    icon: Users,
    color: 'text-blue-500',
  },
  {
    id: 'private',
    label: 'Private Events',
    description: 'Corporate, team events, private',
    icon: Building2,
    color: 'text-purple-500',
  },
  {
    id: 'in_person',
    label: 'In-Person',
    description: 'Venue-based physical events',
    icon: MapPin,
    color: 'text-green-500',
  },
  {
    id: 'virtual',
    label: 'Virtual/Hybrid',
    description: 'Online or both formats',
    icon: Globe,
    color: 'text-orange-500',
  },
];

export const EventTypesScreen = () => {
  const navigate = useNavigate();
  const { saveProgress, getStatus, isLoading } = useOnboarding();
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load saved preferences
    const loadSavedPreferences = async () => {
      try {
        const status = await getStatus();
        if (status.savedPreferences?.organizerEventTypes) {
          setSelectedTypes(new Set(status.savedPreferences.organizerEventTypes));
        }
      } catch (error) {
        console.error('Failed to load saved preferences:', error);
      }
    };

    loadSavedPreferences();
  }, [getStatus]);

  const toggleType = (typeId: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId);
    } else {
      newSelected.add(typeId);
    }
    setSelectedTypes(newSelected);
  };

  const handleContinue = async () => {
    try {
      // Save progress with event types
      await saveProgress({
        organizerEventTypes: Array.from(selectedTypes),
      });

      // Navigate to notifications
      navigate('/onboarding/notifications');
    } catch (error) {
      console.error('Failed to save event types:', error);
    }
  };

  const handleSkip = () => {
    navigate('/onboarding/notifications');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={5}
      title="What type of events do you want to organize?"
      subtitle="Select all that apply"
      onSkip={handleSkip}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedTypes.has(type.id);

            return (
              <Card
                key={type.id}
                className={`p-6 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md scale-105'
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                }`}
                onClick={() => toggleType(type.id)}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-lg ${
                        isSelected ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? 'text-primary' : type.color
                        }`}
                      />
                    </div>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-card-title mb-1">{type.label}</h3>
                    <p className="text-card-description">
                      {type.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {selectedTypes.size > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2">
            <span className="text-lg">💡</span>
            <span>
              This helps us tailor your event creation flow
            </span>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="flex-1"
            size="lg"
          >
            {isLoading ? 'Saving...' : 'Continue →'}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default EventTypesScreen;
