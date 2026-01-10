import { useState, useCallback } from 'react';
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';

export interface UseMultiStepFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  steps: number;
  onStepChange?: (step: number) => void;
}

export interface UseMultiStepFormReturn {
  currentStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  progress: number;
}

/**
 * Hook to manage multi-step form state and navigation
 * Works seamlessly with React Hook Form
 *
 * @example
 * const form = useForm<MyFormData>({ resolver: zodResolver(schema) });
 * const multiStep = useMultiStepForm({ form, steps: 3 });
 *
 * // Navigate
 * multiStep.goToNextStep();
 * multiStep.goToPreviousStep();
 *
 * // Check state
 * if (multiStep.isLastStep) { handleSubmit(); }
 */
export function useMultiStepForm<T extends FieldValues>({
  form: _form,
  steps,
  onStepChange,
}: UseMultiStepFormProps<T>): UseMultiStepFormReturn {
  const [currentStep, setCurrentStep] = useState(1);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps;
  const progress = (currentStep / steps) * 100;

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step > steps) return;
      setCurrentStep(step);
      onStepChange?.(step);
    },
    [steps, onStepChange]
  );

  const goToNextStep = useCallback(() => {
    if (currentStep < steps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  }, [currentStep, steps, onStepChange]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  }, [currentStep, onStepChange]);

  return {
    currentStep,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    progress,
  };
}

/**
 * Helper to validate specific fields before step transition
 *
 * @example
 * const canProceed = await validateStepFields(form, ['firstName', 'lastName', 'email']);
 * if (canProceed) { multiStep.goToNextStep(); }
 */
export async function validateStepFields<T extends FieldValues>(
  form: UseFormReturn<T>,
  fields: Path<T>[]
): Promise<boolean> {
  const result = await form.trigger(fields);
  return result;
}
