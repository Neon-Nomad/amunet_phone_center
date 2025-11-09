import { useMemo, useState } from 'react';

import ChatBubble from './ChatBubble';
import { queryChatbot, type ChatAction, type ChatResponse } from './ChatAPI';
import './styles.css';

interface Message {
  id: string;
  author: 'assistant' | 'user';
  text: string;
}

const initialMessages: Message[] = [
  {
    id: 'welcome',
    author: 'assistant',
    text: 'Hey there! I can help with onboarding, pricing, or booking a demo. What can I do for you today?'
  }
];

const buildStatusFromActions = (actions: ChatAction[]) => {
  if (!actions.length) {
    return 'I am listening.';
  }

  const types = actions.map((action) => action.type).join(', ');
  return `Available actions: ${types}`;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [latestPricing, setLatestPricing] = useState<ChatResponse['pricing']>();
  const [latestActions, setLatestActions] = useState<ChatAction[]>([]);
  const [status, setStatus] = useState('I am listening.');
  const [isLoading, setIsLoading] = useState(false);

  const userType = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'visitor';
    }

    const stored = window.localStorage.getItem('amunet-tenant');
    if (!stored) {
      return 'visitor';
    }

    try {
      const parsed = JSON.parse(stored);
      return parsed?.tenantId ? 'customer' : 'trial';
    } catch (error) {
      console.error('Failed to parse tenant data', error);
      return 'visitor';
    }
  }, []);

  const handleAction = (action: ChatAction) => {
    if (action.type === 'book_demo' && action.payload?.url && typeof window !== 'undefined') {
      window.open(action.payload.url, '_blank');
      setStatus('Opening the demo booking page...');
      return;
    }

    if (action.type === 'notify_live_agent') {
      setStatus('A human teammate has been notified and will reach out shortly.');
      return;
    }

    if (action.type === 'send_email') {
      setStatus('We will follow up by email soon.');
    }
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    const newMessage: Message = { id: `user-${Date.now()}`, author: 'user', text: trimmed };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);
    setStatus('Thinking...');

    try {
      const response = await queryChatbot({ message: trimmed, userType });
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        author: 'assistant',
        text: response.text
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLatestPricing(response.pricing);
      setLatestActions(response.actions ?? []);
      setStatus(buildStatusFromActions(response.actions ?? []));
    } catch (error) {
      console.error('Chat request failed', error);
      setStatus('Oops! Something went wrong. Try again in a moment.');
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          author: 'assistant',
          text: 'I had trouble reaching the Amunet assistant. Please try again soon.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget__panel">
          <div className="chat-widget__header">
            <div className="chat-widget__title">Amunet AI Concierge</div>
            <button className="chat-widget__close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chat-widget__messages">
            {messages.map((message) => (
              <ChatBubble key={message.id} author={message.author} text={message.text} />
            ))}
            {isLoading && <div className="chat-widget__typing">Amunet is typing...</div>}
          </div>
          {latestPricing && latestPricing.length > 0 && (
            <div className="chat-widget__pricing">
              {latestPricing.map((tier) => (
                <div key={tier.name} className="chat-widget__pricing-card">
                  <p className="font-semibold">{tier.name}</p>
                  <p className="text-sm text-slate-400">{tier.price}</p>
                </div>
              ))}
            </div>
          )}
          {latestActions.length > 0 && (
            <div className="chat-widget__actions">
              {latestActions.map((action, index) => (
                <button
                  key={`${action.type}-${index}`}
                  className="chat-widget__action-pill"
                  onClick={() => handleAction(action)}
                  type="button"
                >
                  {action.type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
          <div className="chat-widget__meta">{status}</div>
          <div className="chat-widget__input-row">
            <input
              className="chat-widget__input"
              aria-label="Message" value={inputValue} onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about onboarding, pricing, or demo"
              disabled={isLoading}
            />
            <button
              className="chat-widget__submit"
              onClick={handleSend}
              type="button"
              disabled={isLoading}
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button className="chat-widget__button" onClick={() => setIsOpen((prev) => !prev)} aria-label="Open chat">
        {isOpen ? '×' : '??'}
      </button>
    </div>
  );
}

