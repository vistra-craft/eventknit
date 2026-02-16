/**
 * Onboarding Screen 2A: Interest Selection
 *
 * Shown when: User selected "Attend events" or "Both"
 * Purpose: Understand event interests for personalized recommendations
 * Collects: eventInterests - Array of category IDs
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Music, Palette, Briefcase, Code, Utensils, Dumbbell, GraduationCap, Gamepad2, Users, Sparkles } from 'lucide-react';

const INTEREST_CATEGORIES = [
  { id: 'music', label: 'Music', icon: Music, color: 'text-pink-500' },
  { id: 'arts', label: 'Arts', icon: Palette, color: 'text-purple-500' },
  { id: 'business', label: 'Business', icon: Briefcase, color: 'text-blue-500' },
  { id: 'tech', label: 'Tech', icon: Code, color: 'text-green-500' },
  { id: 'food', label: 'Food', icon: Utensils, color: 'text-orange-500' },
  { id: 'sports', label: 'Sports', icon: Dumbbell, color: 'text-red-500' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'text-indigo-500' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: 'text-cyan-500' },
  { id: 'community', label: 'Community', icon: Users, color: 'text-teal-500' },
  { id: 'entertainment', label: 'Entertainment', icon: Sparkles, color: 'text-yellow-500' },
];

export const InterestsScreen = () => {
  const navigate = useNavigate();
  const { saveProgress, getStatus, isLoading } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [savedIntent, setSavedIntent] = useState<string | null>(null);

  useEffect(() => {
    // Load saved preferences
    const loadSavedPreferences = async () => {
      try {
        const status = await getStatus();
        if (status.savedPreferences?.eventInterests) {
          setSelectedInterests(new Set(status.savedPreferences.eventInterests));
        }
        if (status.savedPreferences?.intent) {
          setSavedIntent(status.savedPreferences.intent);
        }
      } catch (error) {
        console.error('Failed to load saved preferences:', error);
      }
    };

    loadSavedPreferences();
  }, [getStatus]);

  const toggleInterest = (interestId: string) => {
    const newSelected = new Set(selectedInterests);
    if (newSelected.has(interestId)) {
      newSelected.delete(interestId);
    } else {
      newSelected.add(interestId);
    }
    setSelectedInterests(newSelected);
  };

  const handleContinue = async () => {
    try {
      // Save progress with interests
      await saveProgress({
        eventInterests: Array.from(selectedInterests),
      });

      // Navigate based on original intent
      if (savedIntent === 'both') {
        // If user selected both, show event types next
        navigate('/onboarding/event-types');
      } else {
        // If only attend, go to notifications
        navigate('/onboarding/notifications');
      }
    } catch (error) {
      console.error('Failed to save interests:', error);
    }
  };

  const handleSkip = () => {
    if (savedIntent === 'both') {
      navigate('/onboarding/event-types');
    } else {
      navigate('/onboarding/notifications');
    }
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={5}
      title="What kind of events interest you?"
      subtitle="Select as many as you like"
      onSkip={handleSkip}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {INTEREST_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedInterests.has(category.id);

            return (
              <button
                key={category.id}
                onClick={() => toggleInterest(category.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md scale-105'
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : category.color}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>

        {selectedInterests.size > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2">
            <span className="text-lg">✨</span>
            <span>
              Great! We'll show you {selectedInterests.size === 1 ? 'events' : 'lots of events'} matching your interests.
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

export default InterestsScreen;
