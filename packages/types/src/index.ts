export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AiMessage {
  role: 'CUSTOMER' | 'AI' | 'STAFF' | 'SYSTEM';
  content: string;
  contentType?: string;
  createdAt: string;
}

export interface AiConversationResponse {
  conversationId: string;
  message: string;
  intent?: string;
  action?: {
    type?: string;
    appointment?: any;
  };
  customer: any;
}
