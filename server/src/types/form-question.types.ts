/**
 * Shared FormQuestion type used by both EventForm and EventSurvey systems.
 * Stored as a JSON array in the database.
 */

export type FormQuestionType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'url'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'rating'
  | 'scale'
  | 'file_upload'
  | 'section_break';

export interface FormQuestionOption {
  value: string;
  label: string;
}

export interface FormQuestion {
  id: string;
  type: FormQuestionType;
  label: string;
  helpText?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  // For choice-based questions
  options?: FormQuestionOption[];
  // For rating/scale questions
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  // For file upload
  acceptedFileTypes?: string[];
  maxFileSizeMb?: number;
  // For section_break (purely cosmetic)
  sectionTitle?: string;
  sectionDescription?: string;
}

/** Answers map stored in FormResponse.answers */
export type FormAnswers = Record<string, string | string[] | number | null>;
