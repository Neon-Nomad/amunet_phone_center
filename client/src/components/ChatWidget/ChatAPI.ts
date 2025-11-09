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

const determineBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/u, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:4000';
    }
  }

  return '';
};

const API_BASE = determineBaseUrl();

const buildUrl = (path: string) => {
  if (!API_BASE) {
    return path;
  }

  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export async function queryChatbot(payload: ChatPayload): Promise<ChatResponse> {
  const response = await fetch(buildUrl('/api/chat'), {
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
