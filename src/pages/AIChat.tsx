import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, Bot, User, Loader2, Sparkles, Trash2, 
  Copy, Zap, BookOpen, Wand2, Feather, Smile, 
  BrainCircuit, Paperclip, X, ChevronDown, Swords,
  ScrollText
} from 'lucide-react';
import { AppSettings, Character, Story } from '../types';

interface AIChatProps {
  settings: AppSettings;
  t: any;
  characters?: Character[];
  stories?: Story[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

type Personality = 'inspiradora' | 'seria' | 'poetica' | 'divertida';
type ResponseLength = 'fast' | 'detailed';

const PERSONALITIES: { id: Personality; label: string; icon: React.ReactNode; description: string; prompt: string }[] = [
  {
    id: 'inspiradora',
    label: 'Inspiradora',
    icon: <Sparkles size={15} />,
    description: 'Encorajadora e motivadora',
    prompt: 'Você é Muse, assistente de escrita criativa do Tinteiro. Seja encorajadora, calorosa e inspire o escritor a superar seus limites. Use metáforas bonitas e celebre cada progresso. Responda sempre em português.'
  },
  {
    id: 'seria',
    label: 'Séria',
    icon: <BrainCircuit size={15} />,
    description: 'Técnica e profissional',
    prompt: 'Você é Muse, assistente de escrita criativa do Tinteiro. Seja técnica, direta e profissional. Foque em técnicas narrativas, estrutura de história e craft literário. Dê feedback honesto e construtivo. Responda sempre em português.'
  },
  {
    id: 'poetica',
    label: 'Poética',
    icon: <Feather size={15} />,
    description: 'Lírica e contemplativa',
    prompt: 'Você é Muse, assistente de escrita criativa do Tinteiro. Fale de forma poética, lírica e contemplativa. Use linguagem rica, evocativa e cheia de imagens. Trate a escrita como uma arte sagrada. Responda sempre em português.'
  },
  {
    id: 'divertida',
    label: 'Divertida',
    icon: <Smile size={15} />,
    description: 'Descontraída e animada',
    prompt: 'Você é Muse, assistente de escrita criativa do Tinteiro. Seja bem-humorada, descontraída e use emojis com moderação. Torne o processo de escrever leve e divertido, sem perder a qualidade do conselho. Responda sempre em português.'
  },
];

const SUGGESTIONS = [
  { icon: <Swords size={14} />, text: "Como criar um conflito envolvente?" },
  { icon: <User size={14} />, text: "Como criar um personagem memorável?" },
  { icon: <Wand2 size={14} />, text: "Como construir um sistema de magia?" },
  { icon: <ScrollText size={14} />, text: "Como escrever diálogos naturais?" },
];

export const AIChat: React.FC<AIChatProps> = ({ settings, t, characters = [], stories = [] }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Eu sou Muse, sua assistente de escrita criativa. Estou aqui para ajudar você a dar vida às suas histórias. O que vamos criar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseLength, setResponseLength] = useState<ResponseLength>('fast');
  const [personality, setPersonality] = useState<Personality>('inspiradora');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [attachedContext, setAttachedContext] = useState<{ type: 'character' | 'story'; name: string; data: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentPersonality = PERSONALITIES.find(p => p.id === personality)!;

  const getSystemPrompt = () => {
    let prompt = currentPersonality.prompt;
    if (responseLength === 'fast') prompt += ' Seja concisa e direta.';
    else prompt += ' Seja detalhada, dê exemplos concretos e explique o raciocínio.';
    if (attachedContext) {
      prompt += `\n\nO escritor compartilhou o seguinte contexto para esta conversa:\n[${attachedContext.type === 'character' ? 'PERSONAGEM' : 'HISTÓRIA'}]: ${attachedContext.name}\n${attachedContext.data}`;
    }
    return prompt;
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage = { role: 'user' as const, text: messageText };
    
    // Use functional update to ensure we have the latest state
    setMessages(prev => [...prev, userMessage, { role: 'model' as const, text: "" }]);
    setInput('');
    setIsLoading(true);

    let fullResponse = "";

    try {
      const apiKey = settings.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key não configurada");

      const ai = new GoogleGenAI({ apiKey });
      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMessage].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: { systemInstruction: getSystemPrompt() }
      });

      for await (const chunk of stream) {
        const textChunk = chunk.text || "";
        fullResponse += textChunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullResponse;
          return newMsgs;
        });
      }

      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev.slice(0, -1), { role: 'model' as const, text: "Erro ao conectar com a Muse. Verifique sua API Key nas configurações." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'model', text: 'Olá! Estou pronta para uma nova jornada criativa. Como posso ajudar?' }]);
    setAttachedContext(null);
    setShowDeleteConfirm(false);
  };

  const attachCharacter = (char: Character) => {
    const data = `Nome: ${char.basicInfo.name}. Espécie: ${char.basicInfo.species || 'N/A'}. Papel: ${char.basicInfo.role || 'N/A'}. Personalidade: ${char.personality?.traits?.map(p => p.name).join(', ') || 'N/A'}. Motivação: ${char.personality?.motivation || 'N/A'}. Backstory: ${char.history?.lore || 'N/A'}.`;
    setAttachedContext({ type: 'character', name: char.basicInfo.name, data });
    setShowContextMenu(false);
  };

  const attachStory = (story: Story) => {
    const data = `Título: ${story.title}. Gênero: ${story.category || 'N/A'}. Sinopse: ${story.content?.slice(0, 500) || 'N/A'}`;
    setAttachedContext({ type: 'story', name: story.title, data });
    setShowContextMenu(false);
  };

  const isFirstMessage = messages.length === 1 && !isLoading;

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent)]/10 rounded-xl">
            <Sparkles className="text-[var(--accent)]" size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">{t.aiChat || 'Chat IA'}</h1>
            <p className="text-xs opacity-40">Muse — assistente criativa</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Personality selector */}
          <div className="relative">
            <button
              onClick={() => { setShowPersonalityMenu(p => !p); setShowContextMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-bold hover:border-[var(--accent)] transition-all"
            >
              {currentPersonality.icon}
              <span className="hidden sm:inline">{currentPersonality.label}</span>
              <ChevronDown size={12} className={`transition-transform ${showPersonalityMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPersonalityMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden">
                {PERSONALITIES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setPersonality(p.id); setShowPersonalityMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg)] transition-all ${personality === p.id ? 'text-[var(--accent)]' : ''}`}
                  >
                    <span className={personality === p.id ? 'text-[var(--accent)]' : 'opacity-50'}>{p.icon}</span>
                    <div>
                      <p className="text-sm font-bold">{p.label}</p>
                      <p className="text-xs opacity-50">{p.description}</p>
                    </div>
                    {personality === p.id && <Sparkles size={12} className="ml-auto text-[var(--accent)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Response length */}
          <button
            onClick={() => setResponseLength(prev => prev === 'fast' ? 'detailed' : 'fast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${responseLength === 'fast' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)]'}`}
          >
            {responseLength === 'fast' ? <Zap size={13} /> : <BookOpen size={13} />}
            <span className="hidden sm:inline">{responseLength === 'fast' ? 'Rápida' : 'Detalhada'}</span>
          </button>

          {/* Clear */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
            title="Limpar conversa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Context badge */}
      {attachedContext && (
        <div className="px-4 py-2 bg-[var(--accent)]/5 border-b border-[var(--accent)]/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--accent)] font-medium">
            <Paperclip size={13} />
            <span>Contexto: <strong>{attachedContext.name}</strong> ({attachedContext.type === 'character' ? 'Personagem' : 'História'})</span>
          </div>
          <button onClick={() => setAttachedContext(null)} className="text-[var(--accent)] hover:opacity-70 transition-all">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-[var(--accent)]" />
              </div>
            )}
            <div className={`max-w-[78%] group relative`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-serif
                ${msg.role === 'user'
                  ? 'bg-[var(--accent)] text-white rounded-br-sm'
                  : 'bg-[var(--card)] border border-[var(--border)] rounded-bl-sm'
                }`}
              >
                {msg.text || (isLoading && i === messages.length - 1 && (
                  <span className="flex gap-1 items-center opacity-60">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ))}
              </div>
              {msg.role === 'model' && msg.text && (
                <button
                  onClick={() => navigator.clipboard.writeText(msg.text)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--card)] border border-[var(--border)] rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:border-[var(--accent)]"
                >
                  <Copy size={11} />
                </button>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 bg-[var(--card)] border-t border-[var(--border)] shrink-0 sticky bottom-0">
        <div className="max-w-4xl mx-auto space-y-3">

          {/* Suggestion chips — só aparecem no início */}
          {isFirstMessage && (
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.text)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all text-left group"
                >
                  <span className="text-[var(--accent)] opacity-60 group-hover:opacity-100 transition-all shrink-0">{s.icon}</span>
                  <span className="text-xs font-medium leading-tight">{s.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex gap-2 items-end">
            {/* Attach context button */}
            <div className="relative">
              <button
                onClick={() => { setShowContextMenu(p => !p); setShowPersonalityMenu(false); }}
                className={`p-3 rounded-xl border transition-all ${attachedContext ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}
                title="Anexar contexto"
              >
                <Paperclip size={18} />
              </button>

              {showContextMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden">
                  {characters.length === 0 && stories.length === 0 ? (
                    <p className="text-xs opacity-50 p-4 text-center">Nenhum personagem ou história criada ainda.</p>
                  ) : (
                    <>
                      {characters.length > 0 && (
                        <div>
                          <p className="text-xs font-bold opacity-40 px-4 pt-3 pb-1 uppercase tracking-wider">Personagens</p>
                          {characters.map(c => (
                            <button key={c.id} onClick={() => attachCharacter(c)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg)] transition-all text-left">
                              {c.imageUrl
                                ? <img src={c.imageUrl} className="w-7 h-7 rounded-lg object-cover" />
                                : <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] text-xs font-bold">{c.basicInfo.name.charAt(0)}</div>
                              }
                              <span className="text-sm font-medium truncate">{c.basicInfo.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {stories.length > 0 && (
                        <div>
                          <p className="text-xs font-bold opacity-40 px-4 pt-3 pb-1 uppercase tracking-wider">Histórias</p>
                          {stories.map(s => (
                            <button key={s.id} onClick={() => attachStory(s)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg)] transition-all text-left">
                              <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                                <BookOpen size={14} />
                              </div>
                              <span className="text-sm font-medium truncate">{s.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Peça ajuda com sua história..."
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Limpar conversa?</h3>
            <p className="opacity-60 text-sm">O histórico será apagado e o contexto anexado será removido.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 hover:bg-[var(--bg)] rounded-xl text-sm transition-all">Cancelar</button>
              <button onClick={clearChat} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm transition-all">Limpar</button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {(showPersonalityMenu || showContextMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowPersonalityMenu(false); setShowContextMenu(false); }} />
      )}
    </div>
  );
};
