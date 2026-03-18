import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Copy, Zap, BookOpen } from 'lucide-react';
import { AppSettings, useLocalStorage } from '../types';

interface AIChatProps {
  settings: AppSettings;
  t: any;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const SUGGESTIONS = [
  "Como criar um personagem memorável?",
  "Dicas para superar o bloqueio criativo",
  "Como construir um sistema de magia?",
  "Como escrever diálogos naturais?"
];

const getSystemPrompt = (length: 'fast' | 'detailed') => {
  const base = "Você é Muse, uma assistente de escrita criativa do Inkwell. Você é especialista em narrativa, construção de personagens, worldbuilding e técnicas de escrita. Seja encorajadora, criativa e dê exemplos práticos. Responda sempre em português, de forma calorosa e inspiradora.";
  if (length === 'fast') return base + " Seja direta, concisa e objetiva.";
  return base + " Seja detalhada, aprofundada, dê exemplos concretos e explique o porquê das coisas.";
};

const INITIAL_MESSAGE: Message = { role: 'model', text: 'Olá! Eu sou Muse, sua assistente de escrita criativa. Estou aqui para ajudar você a dar vida às suas histórias. O que vamos criar hoje?' };

export const AIChat: React.FC<AIChatProps> = ({ settings, t }) => {
  const [savedMessages, setSavedMessages] = useLocalStorage<Message[]>('inkwell-chat-history', [INITIAL_MESSAGE]);
  const [messages, setMessages] = useState<Message[]>(savedMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseLength, setResponseLength] = useState<'fast' | 'detailed'>('fast');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasUserSentMessage = messages.some(m => m.role === 'user');

  useEffect(() => {
    setSavedMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', text: messageText };
    const updatedMessages = [...messages, userMessage];
    const messagesWithPlaceholder = [...updatedMessages, { role: 'model' as const, text: "" }];
    
    setMessages(messagesWithPlaceholder);
    setInput('');
    setIsLoading(true);

    let fullResponse = "";

    try {
      const apiKey = settings.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key não configurada");

      const ai = new GoogleGenAI({ apiKey });
      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: updatedMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: getSystemPrompt(responseLength)
        }
      });

      for await (const chunk of stream) {
        fullResponse += chunk.text || "";
        setMessages([...updatedMessages, { role: 'model', text: fullResponse }]);
      }
    } catch (error) {
      console.error(error);
      setMessages([...updatedMessages, { role: 'model', text: "Erro ao conectar com a Muse. Verifique sua API Key nas configurações." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)]">
      <header className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Sparkles className="text-[var(--accent)]" size={24} />
          <h1 className="text-xl font-bold">{t.aiChat}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setResponseLength(prev => prev === 'fast' ? 'detailed' : 'fast')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${responseLength === 'fast' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)]'}`}
          >
            {responseLength === 'fast' ? <Zap size={14} /> : <BookOpen size={14} />}
            {responseLength === 'fast' ? 'Rápida' : 'Detalhada'}
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl flex gap-4 ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-tr-none' : 'bg-[var(--card)] border border-[var(--border)] rounded-tl-none'}`}>
              <div className="shrink-0 mt-1">
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} className="text-[var(--accent)]" />}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif">
                {msg.text || <Loader2 className="animate-spin" size={16} />}
              </div>
              {msg.role === 'model' && msg.text && (
                <button onClick={() => navigator.clipboard.writeText(msg.text)} className="opacity-30 hover:opacity-100 self-start mt-1">
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-[var(--card)] border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto space-y-4">
          {!hasUserSentMessage && !isLoading && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} className="text-xs px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-full hover:border-[var(--accent)] transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Peça ajuda com sua história..."
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
            />
            <button onClick={() => handleSend()} disabled={isLoading} className="p-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Excluir conversa?</h3>
            <p className="opacity-60">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 hover:bg-[var(--bg)] rounded-lg">Cancelar</button>
              <button onClick={clearChat} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
