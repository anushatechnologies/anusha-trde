import { apiClient } from '../api/client';

export type LegalDocument = {
  documentKey: string;
  title: string;
  summary: string;
  content: string;
  effectiveDate: string;
  updatedAt: string;
};

export const legalService = {
  getLegalDocument: async (documentKey: string): Promise<LegalDocument> => {
    // API Spec says: Auth required: No
    // But apiClient injects auth if it exists, which is fine.
    const response = await apiClient.get<LegalDocument>(`/api/legal/${encodeURIComponent(documentKey)}`);
    return response.data;
  },
};
