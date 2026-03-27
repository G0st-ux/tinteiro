import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, Bot, User, Loader2, Sparkles, Trash2, 
  Copy, Zap, BookOpen, Wand2, Feather, Smile, 
  BrainCircuit, Paperclip, X, ChevronDown, Swords,
  ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
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
    prompt += "\n\nDIRETRIZES DE RESPOSTA (ESTRITAMENTE OBRIGATÓRIO):";
    if (responseLength === 'fast') {
      prompt += '\n- Responda de forma EXTREMAMENTE CURTA, CONCISA e DIRETA.';
      prompt += '\n- NUNCA ultrapasse 2 parágrafos curtos.';
      prompt += '\n- NUNCA use introduções como "Certamente!", "Com certeza!", "Aqui está..." ou "Como assistente...".';
      prompt += '\n- Vá direto à resposta ou sugestão.';
      prompt += '\n- Se for uma lista, limite a NO MÁXIMO 3 itens curtos.';
      prompt += '\n- Priorize a velocidade e a brevidade absoluta.';
    } else {
      prompt += '\n- Responda de forma EXHAUSTIVA, DETALHADA e PROFUNDA.';
      prompt += '\n- Use pelo menos 4-6 parágrafos bem estruturados.';
      prompt += '\n- Forneça múltiplos exemplos práticos, diálogos de demonstração ou estruturas narrativas completas.';
      prompt += '\n- Explique detalhadamente a teoria literária ou os conceitos por trás das suas sugestões.';
      prompt += '\n- Use formatação Markdown rica (títulos, negrito, itálico, listas, blocos de citação, tabelas se necessário).';
      prompt += '\n- Sinta-se à vontade para expandir o assunto e oferecer insights adicionais não solicitados mas relevantes.';
    }
    
    if (attachedContext) {
      prompt += `\n\nCONTEXTO DO USUÁRIO (USE ISSO PARA PERSONALIZAR A RESPOSTA):\n[${attachedContext.type === 'character' ? 'PERSONAGEM' : 'HISTÓRIA'}]: ${attachedContext.name}\n${attachedContext.data}`;
    }
    return prompt;
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage = { role: 'user' as const, text: messageText };
    
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
        config: { 
          systemInstruction: getSystemPrompt(),
          temperature: responseLength === 'fast' ? 0.7 : 1.0,
          topP: 0.95,
          topK: 40
        }
      });

      for await (const chunk of stream) {
        const textChunk = chunk.text || "";
        fullResponse += textChunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullResponse;
          return newMsgs;
        });
        
        // Auto-scroll while streaming
        if (scrollRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
          if (scrollHeight - scrollTop - clientHeight < 100) {
            scrollRef.current.scrollTop = scrollHeight;
          }
        }
      }
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
    <div className="h-[100dvh] flex flex-col bg-[var(--bg)] relative overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between card-ink shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-[2px] flex items-center justify-center shadow-[inset_0_0_20px_rgba(200,169,110,0.05)]">
            <Sparkles className="text-[var(--accent)]" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif leading-tight tracking-tight">{t.aiChat || 'Chat IA'}</h1>
            <p className="label">Muse — assistente criativa</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Personality selector */}
          <div className="relative">
            <button
              onClick={() => { setShowPersonalityMenu(p => !p); setShowContextMenu(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-[2px] border border-[var(--border)] text-xs font-bold hover:border-[var(--accent)] transition-all bg-[var(--bg)]/50"
            >
              {currentPersonality.icon}
              <span className="hidden sm:inline">{currentPersonality.label}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${showPersonalityMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPersonalityMenu && (
              <div className="absolute right-0 top-full mt-3 w-64 card-ink z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 space-y-1">
                  {PERSONALITIES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setPersonality(p.id); setShowPersonalityMenu(false); }}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-[2px] transition-all ${personality === p.id ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'hover:bg-[var(--bg)]'}`}
                    >
                      <span className={personality === p.id ? 'text-[var(--accent)]' : 'opacity-50'}>{p.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{p.label}</p>
                        <p className="text-[10px] opacity-50">{p.description}</p>
                      </div>
                      {personality === p.id && <div className="ml-auto w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Response length */}
          <button
            onClick={() => setResponseLength(prev => prev === 'fast' ? 'detailed' : 'fast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-[2px] border text-xs font-bold transition-all ${responseLength === 'fast' ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/50'}`}
          >
            {responseLength === 'fast' ? <Zap size={14} /> : <BookOpen size={14} />}
            <span className="hidden sm:inline">{responseLength === 'fast' ? 'Rápida' : 'Detalhada'}</span>
          </button>

          {/* Clear */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-[2px] transition-all border border-transparent hover:border-red-500/20"
            title="Limpar conversa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Context badge */}
      <AnimatePresence>
        {attachedContext && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-2.5 bg-[var(--accent)]/5 border-b border-[var(--accent)]/20 flex items-center justify-between">
              <div className="flex items-center gap-3 label !opacity-100 text-[var(--accent)]">
                <Paperclip size={14} />
                <span>Contexto: <span className="text-white/80">{attachedContext.name}</span></span>
              </div>
              <button onClick={() => setAttachedContext(null)} className="text-[var(--accent)] hover:opacity-70 transition-all p-1">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar pb-48"
      >
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-[2px] flex items-center justify-center shrink-0 shadow-lg
                ${msg.role === 'user' ? 'bg-[var(--accent)] text-black' : 'card-ink text-[var(--accent)] shadow-[inset_0_0_20px_rgba(200,169,110,0.05)]'}`}
              >
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-6 py-4 rounded-[2px] text-[15px] leading-relaxed whitespace-pre-wrap font-serif shadow-xl transition-all
                  ${msg.role === 'user'
                    ? 'bg-[var(--accent)] text-black'
                    : 'card-ink'
                  }`}
                >
                  {msg.text || (isLoading && i === messages.length - 1 && (
                    <span className="flex gap-1.5 items-center opacity-60 py-1.5">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ))}
                </div>
                
                {msg.role === 'model' && msg.text && (
                  <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.text)}
                      className="p-2 hover:bg-[var(--accent)]/10 rounded-[2px] transition-all text-[var(--accent)] border border-transparent hover:border-[var(--accent)]/20"
                      title="Copiar resposta"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Input area at bottom */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[80px] group-data-[sidebar-open=true]:lg:left-[280px] transition-all duration-500 p-6 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent pt-16 z-20">
        <div className="max-w-3xl mx-auto w-full">
          <div className="card-ink p-3 space-y-3 backdrop-blur-xl">
            
            {/* Suggestion chips — só aparecem no início */}
            {isFirstMessage && (
              <div className="flex gap-3 overflow-x-auto pb-2 px-3 no-scrollbar">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s.text)}
                    className="flex items-center gap-3 px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-full hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all text-left group whitespace-nowrap shrink-0"
                  >
                    <span className="text-[var(--accent)] opacity-60 group-hover:opacity-100 transition-all shrink-0">{s.icon}</span>
                    <span className="label !opacity-100">{s.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="flex gap-3 items-end">
              {/* Attach context button */}
              <div className="relative">
                <button
                  onClick={() => { setShowContextMenu(p => !p); setShowPersonalityMenu(false); }}
                  className={`p-4 rounded-[2px] border transition-all ${attachedContext ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg)]'}`}
                  title="Anexar contexto"
                >
                  <Paperclip size={22} />
                </button>

                <AnimatePresence>
                  {showContextMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute bottom-full mb-4 left-0 w-72 card-ink z-50 overflow-hidden"
                    >
                      {characters.length === 0 && stories.length === 0 ? (
                        <p className="text-xs opacity-50 p-6 text-center italic">Nenhum personagem ou história criada ainda.</p>
                      ) : (
                        <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                          {characters.length > 0 && (
                            <div className="space-y-1">
                              <p className="label px-4 pt-3 pb-2">Personagens</p>
                              {characters.map(c => (
                                <button key={c.id} onClick={() => attachCharacter(c)} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg)] rounded-[2px] transition-all text-left">
                                  {c.imageUrl
                                    ? <img src={c.imageUrl} className="w-9 h-9 rounded-[2px] object-cover shadow-sm" />
                                    : <div className="w-9 h-9 rounded-[2px] bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] text-sm font-bold">{c.basicInfo.name.charAt(0)}</div>
                                  }
                                  <span className="text-sm font-bold truncate">{c.basicInfo.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {stories.length > 0 && (
                            <div className="space-y-1 mt-4">
                              <p className="label px-4 pt-3 pb-2">Histórias</p>
                              {stories.map(s => (
                                <button key={s.id} onClick={() => attachStory(s)} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg)] rounded-[2px] transition-all text-left">
                                  <div className="w-9 h-9 rounded-[2px] bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                                    <BookOpen size={18} />
                                  </div>
                                  <span className="text-sm font-bold truncate">{s.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <textarea
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Peça ajuda com sua história..."
                className="input-field flex-1 max-h-48 custom-scrollbar resize-none font-serif text-[15px] py-4"
              />
              
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-4 bg-[var(--accent)] text-black rounded-[2px] hover:opacity-90 disabled:opacity-40 transition-all shadow-xl active:scale-95 shrink-0"
              >
                {isLoading ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
              </button>
            </div>
          </div>
          <p className="label text-center mt-3">Muse pode cometer erros. Verifique informações importantes.</p>
        </div>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative card-ink max-w-md w-full space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-serif">Limpar conversa?</h3>
                <p className="opacity-60 text-base leading-relaxed">O histórico será apagado permanentemente e o contexto anexado será removido. Esta ação não pode ser desfeita.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost flex-1">Cancelar</button>
                <button onClick={clearChat} className="btn-primary flex-1 !bg-red-500 !text-white hover:!bg-red-600 shadow-lg shadow-red-500/20">Limpar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Click outside to close menus */}
      {(showPersonalityMenu || showContextMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowPersonalityMenu(false); setShowContextMenu(false); }} />
      )}
    </div>
  );
};
