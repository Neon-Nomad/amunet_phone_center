import { buildApiUrl } from '../../lib/apiBase';

export interface ChatPayload {
  message: string;
  userType?: 'visitor' | 'trial' | 'customer';
  tenantId?: string;
  intent?: string;
}

export interface ChatAction {
  type: 'book_demo' | 'send_email' | 'notify_live_agent';
  payload?: Record<string, string>;
}

export interface ChatResponse {
  text: string;
  pricing?: {
    name: string;
    price: string;
    description: string;
    features: string[];
  }[];
  actions?: ChatAction[];
}

export async function queryChatbot(payload: ChatPayload): Promise<ChatResponse> {
  const response = await fetch(buildApiUrl('/api/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Chat request failed');
  }

  return response.json();
}
