import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import { chatService } from '../services/api';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';

const SAMPLE_PROMPTS = [
  "Which raw materials require reordering?",
  "What are the main machine downtime reasons?",
  "Which production line has the highest rejection rate?",
  "Which products have the lowest gross margins?",
  "Why did production decrease in September?",
  "How can we reduce material wastage?",
  "What are the top five manufacturing risks?",
  "Generate an improvement plan for next month."
];

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Manufacturing Decision Advisor. I have direct access to your verified factory database covering May 1 to October 31, 2026. Ask me about production throughput, defect Pareto, machine downtime, material stockouts, or product gross margins.",
      sources: ["Finished_Goods", "Production_Batches", "Quality_Inspections", "Machine_Downtime", "Raw_Materials", "Expenses"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const res = await chatService.sendMessage(text, historyPayload);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.response,
          metrics: res.data.metrics,
          sources: res.data.sources
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I encountered an error retrieving data from the backend. Please check your connection.",
          error: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 h-screen">
      <Header
        title="AI Manufacturing Intelligence Chat"
        subtitle="Natural language reasoning grounded strictly in actual database records and deterministic analytics"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Sample Prompt Chips */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-700 mb-2.5 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Quick Verified Business Inquiries:
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 text-slate-600 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center flex-wrap gap-1 text-[10px] text-slate-500">
                    <Database className="w-3 h-3 text-slate-400 mr-1" />
                    <span>Ground Truth Sources:</span>
                    {msg.sources.map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 rounded-bl-none flex items-center space-x-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-2 font-medium">Analyzing factory records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-3 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about factory throughput, downtime root causes, scrap rates, or SKU margins..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
