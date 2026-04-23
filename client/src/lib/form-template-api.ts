import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type { FormPurpose, FormQuestion } from './form-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuiltInTemplate {
  id: null;
  isBuiltIn: true;
  name: string;
  description: string;
  purpose: FormPurpose;
  questions: FormQuestion[];
}

export interface CustomTemplate {
  id: string;
  isBuiltIn: false;
  name: string;
  description: string | null;
  purpose: FormPurpose;
  questions: FormQuestion[];
  createdById: string | null;
  createdBy: { id: string; firstName: string | null; lastName: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export type FormTemplate = BuiltInTemplate | CustomTemplate;

export const FORM_PURPOSE_LABELS: Record<FormPurpose, string> = {
  REGISTRATION:          'Registration',
  FEEDBACK:              'Feedback / Survey',
  SPEAKER_APPLICATION:   'Speaker Application',
  EXHIBITOR_APPLICATION: 'Exhibitor Application',
  SPONSOR_APPLICATION:   'Sponsor Application',
  VOLUNTEER_APPLICATION: 'Volunteer Application',
  PERFORMER_APPLICATION: 'Performer / Artist Application',
  VENDOR_APPLICATION:    'Vendor Application',
  JUDGE_APPLICATION:     'Judge / Reviewer Application',
  MEDIA_APPLICATION:     'Media / Press Application',
  GENERAL_INQUIRY:       'General Inquiry',
  CUSTOM:                'Custom',
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function listAllTemplates(purpose?: FormPurpose): Promise<{
  success: boolean;
  builtIn: BuiltInTemplate[];
  custom: CustomTemplate[];
}> {
  const query = purpose ? `?purpose=${purpose}` : '';
  return apiGet(`/form-templates${query}`);
}

export async function listBuiltInTemplates(purpose?: FormPurpose): Promise<{
  success: boolean;
  templates: BuiltInTemplate[];
}> {
  const query = purpose ? `?purpose=${purpose}` : '';
  return apiGet(`/form-templates/built-in${query}`);
}

export async function getTemplateById(id: string): Promise<{
  success: boolean;
  template: CustomTemplate;
}> {
  return apiGet(`/form-templates/${id}`);
}

export async function createTemplate(data: {
  name: string;
  description?: string;
  purpose: FormPurpose;
  questions: FormQuestion[];
}): Promise<{ success: boolean; template: CustomTemplate }> {
  return apiPost('/form-templates', data);
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    purpose: FormPurpose;
    questions: FormQuestion[];
  }>,
): Promise<{ success: boolean; template: CustomTemplate }> {
  return apiPut(`/form-templates/${id}`, data);
}

export async function deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete(`/form-templates/${id}`);
}
