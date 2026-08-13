import { apiClient } from '../api/client';

export type SupportTicket = {
  id: string;
  userId: string;
  category: 'WITHDRAWAL' | 'INVESTMENT' | 'KYC' | 'BANK' | 'OTHER';
  subject: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketPayload = {
  category: 'WITHDRAWAL' | 'INVESTMENT' | 'KYC' | 'BANK' | 'OTHER';
  subject: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
};

export const supportService = {
  /**
   * List Own Support Tickets (GET /api/support/tickets)
   */
  listOwnTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiClient.get<SupportTicket[]>('/api/support/tickets');
    return response.data;
  },

  /**
   * Create a Support Ticket (POST /api/support/tickets)
   */
  createTicket: async (payload: CreateTicketPayload): Promise<SupportTicket> => {
    const response = await apiClient.post<SupportTicket>('/api/support/tickets', payload);
    return response.data;
  },
};
