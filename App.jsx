import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import './App.css';

// Random session id per browser, kept in localStorage so the server can
// track free-message counts per user across page reloads.
function getSessionId() {
  let id = localStorage.getItem('chatSessionId');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2);
    localStorage.setItem('chatSessionId', id);
  }
  return id;
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const bottomRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || blocked) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, sessionId: sessionId.current }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: data.error, isError: true }]);
        if (res.status === 429) setBlocked(true);
        return;
      }

      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      setRemaining(data.remaining);
      if (data.remaining <= 0) setBlocked(true);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Connection error: ' + err.message, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="brand-name">ChatBot</div>
            <div className="brand-sub">Built by Adeel</div>
          </div>
        </div>
        {remaining !== null && (
          <div className="counter">Free messages: {remaining}</div>
        )}
      </header>

      <main className="chat">
        {messages.length === 0 && (
          <div className="empty-state">Message likho, chat shuru karo.</div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`bubble-row ${m.role === 'user' ? 'right' : 'left'}`}
            style={{ animationDelay: `${Math.min(i, 5) * 0.03}s` }}
          >
            <div
              className={`bubble ${
                m.role === 'user' ? 'bubble-user' : m.isError ? 'bubble-error' : 'bubble-bot'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="bubble-row left">
            <div className="bubble bubble-bot typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {blocked && (
        <div className="signup-banner">
          Free messages khatam ho gaye — unlimited ke liye{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Apna signup/payment page yahan link karo.'); }}>
            account banayein
          </a>
        </div>
      )}

      <footer className="input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={blocked}
          placeholder={blocked ? 'Limit khatam ho gayi' : 'Message likho...'}
        />
        <button onClick={sendMessage} disabled={blocked || !input.trim() || loading}>
          <Send size={16} />
        </button>
      </footer>
    </div>
  );
}
