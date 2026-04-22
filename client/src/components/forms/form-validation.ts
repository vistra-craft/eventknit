import type { FormQuestion } from '@/lib/form-api';

type AnswerValue = string | string[] | number | null;

/** Validate form answers against question requirements. Returns errors map. */
export function validateFormAnswers(
  questions: FormQuestion[],
  answers: Record<string, AnswerValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const q of questions) {
    if (q.type === 'section_break') continue;
    if (!q.required) continue;
    const val = answers[q.id];
    if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
      errors[q.id] = 'This field is required';
    }
  }
  return errors;
}
