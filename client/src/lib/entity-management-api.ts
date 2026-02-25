/**
 * Entity Management API
 * Backend API calls for managing KYC entity types and document requirements
 */

import apiClient from './api-client';

export interface EntityRequirement {
  id: string;
  entityType: string;
  documentType: string;
  description: string | null;
  isRequired: boolean;
  displayOrder: number;
  validityPeriodDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequirementData {
  documentType: string;
  description?: string;
  isRequired: boolean;
}

export interface UpdateRequirementData {
  description?: string;
  isRequired?: boolean;
}

/**
 * Get all entity types
 */
export const getAllEntityTypes = async (): Promise<string[]> => {
  const response = await apiClient.get<{ success: boolean; data: { entityTypes: string[] } }>('/admin/kyc/entity-types');
  return response.data!.entityTypes;
};

/**
 * Get document requirements for a specific entity type
 */
export const getEntityRequirements = async (entityType: string): Promise<EntityRequirement[]> => {
  const response = await apiClient.get<{ success: boolean; data: { requirements: EntityRequirement[] } }>(`/admin/kyc/entity-types/${entityType}/requirements`);
  return response.data!.requirements;
};

/**
 * Add a document requirement for an entity type
 */
export const addEntityRequirement = async (
  entityType: string,
  data: CreateRequirementData
): Promise<EntityRequirement> => {
  const response = await apiClient.post<{ success: boolean; data: { requirement: EntityRequirement } }>(`/admin/kyc/entity-types/${entityType}/requirements`, data);
  return response.data!.requirement;
};

/**
 * Update a document requirement
 */
export const updateEntityRequirement = async (
  entityType: string,
  requirementId: string,
  data: UpdateRequirementData
): Promise<EntityRequirement> => {
  const response = await apiClient.put<{ success: boolean; data: { requirement: EntityRequirement } }>(
    `/admin/kyc/entity-types/${entityType}/requirements/${requirementId}`,
    data
  );
  return response.data!.requirement;
};

/**
 * Delete a document requirement
 */
export const deleteEntityRequirement = async (
  entityType: string,
  requirementId: string
): Promise<void> => {
  await apiClient.delete(`/admin/kyc/entity-types/${entityType}/requirements/${requirementId}`);
};
