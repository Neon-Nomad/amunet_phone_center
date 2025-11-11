interface ChatBubbleProps {
  author: 'assistant' | 'user';
  text: string;
}

export default function ChatBubble({ author, text }: ChatBubbleProps) {
  const base = author === 'assistant' ? 'chat-widget__bubble--assistant' : 'chat-widget__bubble--user';

  return (
    <div className="chat-widget__bubble-row">
      <div className={`chat-widget__bubble ${base}`}>
        <p>{text}</p>
      </div>
    </div>
  );
}
